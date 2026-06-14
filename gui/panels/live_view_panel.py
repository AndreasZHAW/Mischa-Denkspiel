"""
gui/panels/live_view_panel.py
==============================
Displays the current solar image with the fitted circle overlay.

Tab 1: Live (your camera, with sun-detection overlay)
Tab 2: SDO HMI reference (the online "ground truth" – when available)
"""
from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QImage, QPixmap, QFont
from PyQt6.QtWidgets import (
    QLabel, QTabWidget, QVBoxLayout, QWidget,
)

from core.tracking_engine import TrackPoint, PointStatus


def _np_to_pixmap(arr: np.ndarray) -> QPixmap:
    """Convert a numpy image (gray or BGR) into a QPixmap.

    Important: we make a contiguous COPY of the data so the QImage doesn't
    hold a dangling reference to a numpy array that goes out of scope.
    """
    if arr.ndim == 2:
        # grayscale
        arr8 = arr if arr.dtype == np.uint8 else (arr * 255).clip(0, 255).astype(np.uint8)
        h, w = arr8.shape
        buf = bytes(arr8.tobytes())
        qimg = QImage(buf, w, h, w, QImage.Format.Format_Grayscale8).copy()
    else:
        # 3-channel BGR -> RGB
        if arr.dtype != np.uint8:
            arr = (arr * 255).clip(0, 255).astype(np.uint8)
        rgb = np.ascontiguousarray(arr[:, :, ::-1])
        h, w = rgb.shape[:2]
        buf = bytes(rgb.tobytes())
        qimg = QImage(buf, w, h, w * 3, QImage.Format.Format_RGB888).copy()
    return QPixmap.fromImage(qimg)


class _ImageView(QWidget):
    """A simple scaled-image label with an info caption."""

    def __init__(self, placeholder_text: str, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(2, 2, 2, 2)
        layout.setSpacing(2)

        self._img_label = QLabel()
        self._img_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._img_label.setMinimumSize(320, 240)
        self._img_label.setStyleSheet("background:#0f0f17; border:1px solid #313244;")
        self._img_label.setText(placeholder_text)
        layout.addWidget(self._img_label, 1)

        self._info_label = QLabel("–")
        self._info_label.setFont(QFont("Monospace", 8))
        self._info_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self._info_label)

        self._pm: Optional[QPixmap] = None

    def set_pixmap(self, pm: QPixmap) -> None:
        self._pm = pm
        self._rescale()

    def set_info(self, text: str, colour: str = "#cdd6f4") -> None:
        self._info_label.setText(text)
        self._info_label.setStyleSheet(f"color:{colour};")

    def resizeEvent(self, e):
        super().resizeEvent(e)
        self._rescale()

    def _rescale(self) -> None:
        if self._pm is None:
            return
        w = max(self._img_label.width(),  320)
        h = max(self._img_label.height(), 240)
        self._img_label.setPixmap(self._pm.scaled(
            w, h, Qt.AspectRatioMode.KeepAspectRatio,
            Qt.TransformationMode.SmoothTransformation,
        ))


class LiveViewPanel(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(2)

        self._header = QLabel("Live View")
        self._header.setFont(QFont("Sans", 9, QFont.Weight.Bold))
        self._header.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self._header)

        self._tabs = QTabWidget()
        layout.addWidget(self._tabs, 1)

        self._live = _ImageView("No image yet.\nStart tracking or open a session.")
        self._sdo  = _ImageView(
            "SDO reference: not loaded yet.\n"
            "Will appear automatically a few seconds after the first frame,\n"
            "provided an internet connection is available."
        )
        self._tabs.addTab(self._live, "Camera")
        self._tabs.addTab(self._sdo,  "SDO reference")

        # Persistent "sun leaves frame in X" banner — shown below the image tabs
        self._sun_estimate_label = QLabel("")
        self._sun_estimate_label.setFont(QFont("Monospace", 9, QFont.Weight.Bold))
        self._sun_estimate_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._sun_estimate_label.setWordWrap(True)
        self._sun_estimate_label.setMinimumHeight(22)
        self._sun_estimate_label.setStyleSheet(
            "background: #1e1e2e; border-radius: 4px; padding: 2px 6px;"
        )
        layout.addWidget(self._sun_estimate_label)

    # ----- Camera tab (live frames) -----

    def update_frame(self, bgr: np.ndarray, tp: TrackPoint) -> None:
        self._live.set_pixmap(_np_to_pixmap(bgr))
        status_str = tp.status.name if tp.status != PointStatus.OK else "OK"
        colour = {"OK": "#a6e3a1", "OUTLIER": "#f38ba8",
                  "LOW_QUALITY": "#fab387", "DISABLED": "#6c7086"}
        self._live.set_info(
            f"Frame {tp.frame_idx}   cx={tp.cx_px:.1f}  cy={tp.cy_px:.1f}  "
            f"r={tp.radius_px:.1f}  q={tp.quality:.2f}  [{status_str}]",
            colour.get(status_str, "#cdd6f4"),
        )

    def update_sun_in_frame_estimate(
        self,
        sun_cx: float, sun_cy: float, sun_radius_px: float,
        image_w: int, image_h: int,
        drift_x_px_min: float, drift_y_px_min: float,
    ) -> None:
        """Add a 2nd-line caption: how long until sun leaves the frame.

        Args:
            sun_cx, sun_cy:    current sun centre in pixel coords
            sun_radius_px:     current sun radius in pixels
            image_w, image_h:  full image dimensions
            drift_x_px_min:    current drift rate in pixel-x per minute
            drift_y_px_min:    current drift rate in pixel-y per minute
        """
        # Distance from current sun edge to each image edge (in pixels).
        # Negative would mean sun already partially outside.
        d_left   = (sun_cx - sun_radius_px) - 0
        d_right  = image_w - (sun_cx + sun_radius_px)
        d_top    = (sun_cy - sun_radius_px) - 0
        d_bottom = image_h - (sun_cy + sun_radius_px)

        # Time until sun touches each edge given the current drift rate
        # Drift positive in pixel-X = sun moves right; positive Y = down.
        # Use a tiny epsilon so we don't divide by zero.
        eps = 1e-6
        candidates = []   # list of (seconds_until_exit, "which edge")
        if drift_x_px_min < -eps:
            candidates.append((-d_left  * 60.0 / drift_x_px_min, "left"))
        if drift_x_px_min >  eps:
            candidates.append((+d_right * 60.0 / drift_x_px_min, "right"))
        if drift_y_px_min < -eps:
            candidates.append((-d_top    * 60.0 / drift_y_px_min, "top"))
        if drift_y_px_min >  eps:
            candidates.append((+d_bottom * 60.0 / drift_y_px_min, "bottom"))

        # Build status line.  Multi-line so caption doesn't grow horizontally.
        if not candidates or all(s <= 0 for s, _ in candidates):
            extra = "Sun stationary in frame  ·  drift < 1 px/min"
            colour = "#a6e3a1"
        else:
            # Earliest positive exit time
            valid = [(s, edge) for s, edge in candidates if s > 0]
            valid.sort()
            secs, edge = valid[0]
            mm, ss = divmod(int(secs), 60)
            hh, mm = divmod(mm, 60)
            if hh > 0:
                t_str = f"{hh}h {mm:02d}m"
            else:
                t_str = f"{mm}:{ss:02d} min"
            # Colour by urgency
            if secs < 120:    colour = "#f38ba8"  # < 2 min red
            elif secs < 600:  colour = "#fab387"  # < 10 min orange
            else:             colour = "#a6e3a1"  # green

            drift_total = (drift_x_px_min ** 2 + drift_y_px_min ** 2) ** 0.5
            extra = (f"Sun leaves frame ({edge}) in ≈ {t_str}  ·  "
                     f"drift = {drift_total:.1f} px/min")

        # Write to the dedicated sun-estimate banner (persists between frames)
        self._sun_estimate_label.setText(extra)
        self._sun_estimate_label.setStyleSheet(
            f"color: {colour}; background: #1e1e2e; "
            "border-radius: 4px; padding: 2px 6px;"
        )

    def clear(self) -> None:
        """Clear the sun-estimate banner (called on Reset)."""
        self._sun_estimate_label.setText("")
        self._sun_estimate_label.setStyleSheet(
            "background: #1e1e2e; border-radius: 4px; padding: 2px 6px;"
        )

    # ----- SDO tab -----

    def show_sdo_reference(
        self,
        image_path: Optional[Path],
        rotation_deg: Optional[float] = None,
        correlation: Optional[float] = None,
        age_min: Optional[float] = None,
        message: str = "",
    ) -> None:
        """Load the cached SDO JPG into the SDO tab.

        If image_path is None or unreadable, show a status message instead.
        """
        import cv2
        if image_path is None or not Path(image_path).exists():
            self._sdo.set_info(
                f"SDO reference unavailable. {message}" if message
                else "SDO reference unavailable.",
                "#fab387",
            )
            return

        try:
            img = cv2.imread(str(image_path))
            if img is None:
                raise IOError("imread returned None")
        except Exception as e:
            self._sdo.set_info(f"Could not read SDO image: {e}", "#f38ba8")
            return

        self._sdo.set_pixmap(_np_to_pixmap(img))

        parts = []
        if rotation_deg is not None:
            parts.append(f"camera rotation ≈ {rotation_deg:+.1f}°")
        if correlation is not None:
            parts.append(f"correlation = {correlation:.2f}")
        if age_min is not None:
            parts.append(f"ref age {age_min:.0f} min")
        if message:
            parts.append(message)
        text = "SDO HMI continuum"
        if parts:
            text += "  ·  " + "  ·  ".join(parts)
        # Colour by confidence
        if correlation is not None and correlation < 0.3:
            colour = "#fab387"   # low-confidence yellow
        elif correlation is not None:
            colour = "#a6e3a1"
        else:
            colour = "#cdd6f4"
        self._sdo.set_info(text, colour)

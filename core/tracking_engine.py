"""
core/tracking_engine.py
========================
Stores the time-series of sun positions and implements:
  - Outlier flagging (position jump too large)
  - Manual frame disabling (user can click to deactivate)
  - Auto-reset detection (mount was moved)
  - Position export for the drift solver

Design: positions are stored in a plain list of ``TrackPoint`` objects so the
session can be easily serialised to JSON and later replayed in Post-Processing
mode.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto
from typing import Callable, Optional

import numpy as np

from config.config_manager import DriftConfig

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Single tracking point
# ---------------------------------------------------------------------------

class PointStatus(Enum):
    OK          = auto()   # used in solver
    OUTLIER     = auto()   # auto-flagged as outlier
    DISABLED    = auto()   # manually disabled by user
    LOW_QUALITY = auto()   # quality below threshold (downweighted)


@dataclass
class TrackPoint:
    """One measured sun position."""
    timestamp:  datetime
    cx_px:      float          # sub-pixel centre x in image pixels
    cy_px:      float          # sub-pixel centre y in image pixels
    quality:    float          # [0, 1]
    rms_px:     float          # limb-fit residual
    frame_idx:  int            # sequential index
    radius_px:  float = 0.0    # detected sun radius (should be constant!)
    source_file: Optional[str] = None
    status:     PointStatus    = PointStatus.OK
    note:       str            = ""
    image_w:    int = 0        # actual image width  in px (0 = unknown)
    image_h:    int = 0        # actual image height in px (0 = unknown)


# ---------------------------------------------------------------------------
# Main tracking engine
# ---------------------------------------------------------------------------

class TrackingEngine:
    """Accumulates positions and provides the cleaned dataset for the solver.

    Usage:
        engine = TrackingEngine(drift_cfg)
        engine.add_point(tp)                # call for each new frame
        pts = engine.active_points()        # for drift solver

    Reset callbacks:
        engine.on_auto_reset = lambda: gui.show_banner("Mount moved!")
    """

    def __init__(self, cfg: DriftConfig) -> None:
        self._cfg = cfg
        self._points: list[TrackPoint] = []
        self._frame_count = 0
        self._reset_cooldown_frames = 0
        self._last_prev_cx: float = 0.0
        self._last_prev_cy: float = 0.0
        # Optional callback fired when auto-reset is triggered
        self.on_auto_reset: Optional[Callable[[], None]] = None

    # ------------------------------------------------------------------ public

    def add_point(self, point: TrackPoint) -> None:
        """Add a new measurement.  Runs outlier and jump detection."""
        self._frame_count += 1
        point.frame_idx = self._frame_count

        # Per-frame DEBUG log so we can see exactly what's being detected
        logger.debug("Frame %d: cx=%.1f cy=%.1f r=%.1f q=%.2f rms=%.2f",
                     point.frame_idx, point.cx_px, point.cy_px,
                     point.radius_px, point.quality, point.rms_px)

        # === Radius-constancy sanity check ===
        # The sun's apparent diameter changes by less than 0.02 % per day, so
        # detected radius should be essentially constant within a session.
        # If it deviates wildly, the detection is suspect.
        valid_radii = [p.radius_px for p in self._points[-20:]
                       if p.radius_px > 0
                       and p.status in (PointStatus.OK, PointStatus.LOW_QUALITY)]
        if len(valid_radii) >= 5 and point.radius_px > 0:
            median_r = float(np.median(valid_radii))
            rel_dev = abs(point.radius_px - median_r) / median_r
            if rel_dev > 0.15:   # >15 % radius deviation = bad detection
                logger.warning(
                    "Frame %d: radius %.1f deviates %.0f%% from median %.1f "
                    "– marking as outlier (bad detection)",
                    point.frame_idx, point.radius_px,
                    rel_dev * 100, median_r,
                )
                point.status = PointStatus.OUTLIER
                point.note = f"bad radius {point.radius_px:.0f} vs median {median_r:.0f}"
                self._points.append(point)
                return

        # Cooldown after a reset – don't keep re-detecting "jumps" forever
        if self._reset_cooldown_frames > 0:
            self._reset_cooldown_frames -= 1
            self._points.append(point)
            return

        # Check for mount movement (large position jump)
        if self._check_jump(point):
            jump_as = self._last_jump_arcsec
            ridiculous = jump_as > 3000.0
            if ridiculous:
                logger.warning(
                    "Frame %d: ridiculous jump %.0f arcsec  "
                    "(prev %.1f,%.1f → new %.1f,%.1f) — dropping as misdetection",
                    self._frame_count, jump_as,
                    self._last_prev_cx, self._last_prev_cy,
                    point.cx_px, point.cy_px,
                )
                point.status = PointStatus.OUTLIER
                point.note = f"misdetect (jump {jump_as:.0f}″)"
                self._points.append(point)
                return

            logger.info(
                "Jump detected at frame %d: %.1f arcsec  "
                "(prev cx=%.1f cy=%.1f → new cx=%.1f cy=%.1f)",
                self._frame_count, jump_as,
                self._last_prev_cx, self._last_prev_cy,
                point.cx_px, point.cy_px,
            )
            point.note = "jump_detected"
            self._points.append(point)
            if self._cfg.auto_reset_enabled and self.on_auto_reset:
                self._reset_cooldown_frames = 3
                self.on_auto_reset()
            return

        self._points.append(point)
        self._flag_outliers_rolling()

    def reset(self, keep_history: bool = True) -> None:
        """
        Reset the drift curve.

        Args:
            keep_history: If True, old points are kept but marked DISABLED.
                          Useful for post-session review.
        """
        if keep_history:
            for p in self._points:
                if p.status == PointStatus.OK:
                    p.status = PointStatus.DISABLED
        else:
            self._points.clear()
        # After reset, give a few frames cooldown so the next jump-check
        # doesn't compare against stale data
        self._reset_cooldown_frames = 3
        logger.info("TrackingEngine reset (keep_history=%s)", keep_history)

    def toggle_point(self, frame_idx: int) -> None:
        """Manually enable or disable a point by its frame index."""
        for p in self._points:
            if p.frame_idx == frame_idx:
                if p.status == PointStatus.DISABLED:
                    p.status = PointStatus.OK
                else:
                    p.status = PointStatus.DISABLED
                break

    def active_points(self) -> list[TrackPoint]:
        """Return only OK and LOW_QUALITY points for the solver."""
        return [p for p in self._points
                if p.status in (PointStatus.OK, PointStatus.LOW_QUALITY)]

    def all_points(self) -> list[TrackPoint]:
        return list(self._points)

    @property
    def n_total(self) -> int:
        return len(self._points)

    @property
    def n_active(self) -> int:
        return len(self.active_points())

    @property
    def last_jump_arcsec(self) -> float:
        return self._last_jump_arcsec

    # ----------------------------------------------------------------- private

    _last_jump_arcsec: float = 0.0

    def _check_jump(self, new_pt: TrackPoint) -> bool:
        """Return True if the new point represents a large positional jump."""
        active = self.active_points()
        if len(active) < 2:
            return False

        prev = active[-1]
        dx = new_pt.cx_px - prev.cx_px
        dy = new_pt.cy_px - prev.cy_px
        jump_px = np.sqrt(dx ** 2 + dy ** 2)

        jump_arcsec = jump_px * getattr(self, "_plate_scale_hint", 5.0)
        self._last_jump_arcsec = jump_arcsec
        self._last_prev_cx = prev.cx_px
        self._last_prev_cy = prev.cy_px

        return jump_arcsec > self._cfg.auto_reset_threshold_arcsec

    def _flag_outliers_rolling(self, window: int = 10) -> None:
        """
        Flag the most recent point as an outlier if its position deviates
        significantly from a rolling linear prediction.

        Key fixes vs the naive sigma-based approach:
        1. **Minimum sigma floor**: when points are nearly identical, sigma
           gets tiny and EVERY new point becomes a "3-sigma outlier" by
           accident.  Floor it at 1 pixel.
        2. **Absolute residual cap**: also require the residual to exceed
           a real pixel threshold, not just a relative-sigma threshold.
        3. **Only flag truly excessive deviations**: 5-sigma OR > 20 px,
           not 3-sigma.
        """
        active = self.active_points()
        if len(active) < max(5, window):
            return

        recent = active[-window:]
        times = np.array([(p.timestamp - recent[0].timestamp).total_seconds()
                          for p in recent])
        xs = np.array([p.cx_px for p in recent])
        ys = np.array([p.cy_px for p in recent])

        if len(recent) < 4:
            return

        # Fit linear trend to the window EXCLUDING the last point
        t_fit = times[:-1]
        x_fit, y_fit = xs[:-1], ys[:-1]

        px_fit = np.polyfit(t_fit, x_fit, 1)
        py_fit = np.polyfit(t_fit, y_fit, 1)
        x_pred = np.polyval(px_fit, times[-1])
        y_pred = np.polyval(py_fit, times[-1])

        # Residuals from prediction
        residuals_x = x_fit - np.polyval(px_fit, t_fit)
        residuals_y = y_fit - np.polyval(py_fit, t_fit)
        sigma_raw = np.sqrt(np.mean(residuals_x ** 2 + residuals_y ** 2))
        # Floor sigma at 1 px so tiny natural scatter doesn't bite us
        sigma = max(float(sigma_raw), 1.0)

        last = recent[-1]
        deviation = np.sqrt((last.cx_px - x_pred) ** 2 + (last.cy_px - y_pred) ** 2)

        # Flag only when BOTH:
        #   - many sigmas away (relative to the trend)
        #   - more than 20 px absolute deviation (a real measurable gap)
        sigma_thresh = self._cfg.outlier_sigma + 2.0   # 5-sigma instead of 3
        if deviation > sigma_thresh * sigma and deviation > 20.0:
            last.status = PointStatus.OUTLIER
            last.note = (f"outlier (dev={deviation:.1f}px, "
                         f"{deviation/sigma:.1f}σ over 1px floor)")
            logger.debug("Outlier at frame %d: %.1f px = %.1f σ",
                         last.frame_idx, deviation, deviation / sigma)

    def set_plate_scale_hint(self, arcsec_per_px: float) -> None:
        """Provide the plate scale so jump detection works in arcsec."""
        self._plate_scale_hint = arcsec_per_px

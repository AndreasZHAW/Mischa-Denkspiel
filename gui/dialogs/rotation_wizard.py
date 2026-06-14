"""
gui/dialogs/rotation_wizard.py
================================
Compute camera rotation from a saved single-axis test session.

Procedure:
  1. User selects a session JSON file where ONLY azimuth or only altitude
     was deliberately misaligned.
  2. We read the linear drift (px/min in X, px/min in Y) from the OK points.
  3. astropy computes the SKY-frame direction the drift SHOULD have for
     that scenario at the session's mid-time.
  4. Difference between predicted and measured angle = camera rotation.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np
from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QComboBox, QDialog, QFileDialog, QHBoxLayout, QLabel,
    QMessageBox, QPushButton, QTextEdit, QVBoxLayout,
)

from config.config_manager import ConfigManager
from core.rotation_from_testdata import derive_rotation_from_drift

logger = logging.getLogger(__name__)


class RotationWizard(QDialog):
    def __init__(self, cm: ConfigManager, parent=None) -> None:
        super().__init__(parent)
        self.setWindowTitle("Derive Camera Rotation from Test Data")
        self.resize(640, 480)
        self._cm = cm
        self._session_path: Optional[Path] = None

        layout = QVBoxLayout(self)

        intro = QLabel(
            "Compute camera rotation from a session in which ONE axis was "
            "intentionally misaligned.\n\n"
            "1. Pick a session file (.json) from such a test.\n"
            "2. Tell SDAA which axis you perturbed.\n"
            "3. SDAA compares the measured pixel drift direction with the "
            "sky-frame direction predicted for that scenario.\n"
            "4. The difference is your camera rotation."
        )
        intro.setWordWrap(True)
        layout.addWidget(intro)

        row1 = QHBoxLayout()
        self._lbl_session = QLabel("(no session selected)")
        btn_browse = QPushButton("Browse session…")
        btn_browse.clicked.connect(self._browse)
        row1.addWidget(QLabel("Session file:"))
        row1.addWidget(self._lbl_session, 1)
        row1.addWidget(btn_browse)
        layout.addLayout(row1)

        row2 = QHBoxLayout()
        self._cmb_scenario = QComboBox()
        self._cmb_scenario.addItems([
            "azimuth_only — I turned only the azimuth screw",
            "altitude_only — I turned only the altitude screw",
        ])
        row2.addWidget(QLabel("Scenario:"))
        row2.addWidget(self._cmb_scenario, 1)
        layout.addLayout(row2)

        self._btn_run = QPushButton("Compute rotation")
        self._btn_run.clicked.connect(self._run)
        self._btn_run.setEnabled(False)
        layout.addWidget(self._btn_run)

        self._results = QTextEdit()
        self._results.setReadOnly(True)
        layout.addWidget(self._results, 1)

        row3 = QHBoxLayout()
        row3.addStretch()
        self._btn_apply = QPushButton("Apply to config")
        self._btn_apply.setEnabled(False)
        self._btn_apply.clicked.connect(self._apply)
        btn_close = QPushButton("Close")
        btn_close.clicked.connect(self.reject)
        row3.addWidget(self._btn_apply)
        row3.addWidget(btn_close)
        layout.addLayout(row3)

        self._derived_rotation_deg: Optional[float] = None

    def _browse(self):
        start_dir = self._cm.config.paths.sessions_folder
        path, _ = QFileDialog.getOpenFileName(
            self, "Select session", start_dir, "JSON files (*.json)"
        )
        if path:
            self._session_path = Path(path)
            self._lbl_session.setText(self._session_path.name)
            self._btn_run.setEnabled(True)

    def _run(self):
        if self._session_path is None:
            return
        try:
            data = json.loads(self._session_path.read_text())
        except Exception as e:
            QMessageBox.warning(self, "Read error", f"Cannot read session: {e}")
            return

        # Extract OK points
        pts = [p for p in data.get("points", []) if p.get("status") == "OK"]
        if len(pts) < 10:
            QMessageBox.warning(
                self, "Too few points",
                f"Only {len(pts)} OK points – need at least 10."
            )
            return

        # Compute linear fit on cx_px and cy_px vs time
        t0 = datetime.fromisoformat(pts[0]["timestamp_iso"])
        ts = np.array([(datetime.fromisoformat(p["timestamp_iso"]) - t0)
                       .total_seconds() / 60.0 for p in pts])
        xs = np.array([p["cx_px"] for p in pts])
        ys = np.array([p["cy_px"] for p in pts])

        mx, _ = np.polyfit(ts, xs, 1)  # px / min
        my, _ = np.polyfit(ts, ys, 1)

        # Pick scenario name
        scenario = "azimuth_only" if self._cmb_scenario.currentIndex() == 0 else "altitude_only"

        # Mid-time for sky calculation
        mid_ts = datetime.fromisoformat(pts[len(pts) // 2]["timestamp_iso"])

        cfg = self._cm.config
        try:
            res = derive_rotation_from_drift(
                scenario_type=scenario,
                drift_x_px_per_min=float(mx),
                drift_y_px_per_min=float(my),
                observer=cfg.observer,
                observation_time=mid_ts,
                plate_scale_arcsec_px=cfg.plate_scale_arcsec_px,
            )
        except Exception as e:
            QMessageBox.warning(self, "Computation error",
                                f"Failed: {e}")
            logger.exception("rotation wizard failed")
            return

        lines = [
            f"Session file:           {self._session_path.name}",
            f"Number of OK points:    {len(pts)}",
            f"Session midpoint (UTC): {mid_ts.isoformat(timespec='seconds')}",
            f"Measured drift X:       {mx:+.3f} px/min",
            f"Measured drift Y:       {my:+.3f} px/min",
            f"|Drift|:                {np.sqrt(mx**2 + my**2):.3f} px/min",
            "",
        ]
        if res.success:
            lines += [
                f"Camera rotation:        {res.rotation_deg:+.2f}°",
                f"Uncertainty (1σ):       ±{res.uncertainty_deg:.2f}°",
                "",
                "Pressing 'Apply to config' will save this value to your",
                "configuration so future drift measurements use it.",
            ]
            self._derived_rotation_deg = res.rotation_deg
            self._btn_apply.setEnabled(True)
        else:
            lines += [f"⚠ {res.message}"]
            self._btn_apply.setEnabled(False)
        self._results.setPlainText("\n".join(lines))

    def _apply(self):
        if self._derived_rotation_deg is None:
            return
        self._cm.config.calibration.camera_rotation_deg = float(
            self._derived_rotation_deg
        )
        try:
            self._cm.save()
            QMessageBox.information(
                self, "Saved",
                f"Camera rotation {self._derived_rotation_deg:+.2f}° saved.\n"
                "Restart tracking (Stop, Start) for the new value to take effect.",
            )
            self.accept()
        except Exception as e:
            QMessageBox.warning(self, "Save error", f"Could not save config: {e}")

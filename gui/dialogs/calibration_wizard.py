"""
gui/dialogs/calibration_wizard.py
===================================
Camera rotation calibration wizard.

Steps:
  1. Centre the sun in the image.
  2. SDAA captures current centre.
  3. User performs a pure RA slew (East or West, ~5-15 arcmin).
  4. SDAA captures new centre.
  5. Angle between displacement vector and pixel +X = camera rotation.
"""
from __future__ import annotations
from PyQt6.QtWidgets import (
    QDialog, QDialogButtonBox, QLabel, QPushButton, QVBoxLayout,
)
from config.config_manager import ConfigManager


class CalibrationWizard(QDialog):
    def __init__(self, config_manager: ConfigManager, parent=None):
        super().__init__(parent)
        self._cm = config_manager
        self.setWindowTitle("Camera Rotation Calibration")
        self.setMinimumWidth(460)
        self._pos_before = None
        self._pos_after  = None
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel(
            "<b>Camera Rotation Calibration</b><br><br>"
            "This wizard measures how your camera is rotated relative to the sky.<br><br>"
            "<b>Steps:</b><br>"
            "1. Make sure the sun is visible and tracking is running.<br>"
            "2. Click <i>Capture Position 1</i> – SDAA records current sun centre.<br>"
            "3. Slew the mount <b>EAST</b> by 5–15 arcmin using RA only (no Dec).<br>"
            "4. Wait for the next frame to be processed.<br>"
            "5. Click <i>Capture Position 2</i>.<br>"
            "6. Click <i>Compute &amp; Save</i>.<br>"
        ))

        self._status = QLabel("Status: waiting for step 2…")
        layout.addWidget(self._status)

        self._btn1 = QPushButton("1. Capture Position 1 (before slew)")
        self._btn2 = QPushButton("2. Capture Position 2 (after slew)")
        self._btn2.setEnabled(False)
        self._btn_compute = QPushButton("3. Compute & Save rotation angle")
        self._btn_compute.setEnabled(False)

        self._btn1.clicked.connect(self._on_capture1)
        self._btn2.clicked.connect(self._on_capture2)
        self._btn_compute.clicked.connect(self._on_compute)

        layout.addWidget(self._btn1)
        layout.addWidget(self._btn2)
        layout.addWidget(self._btn_compute)

        bb = QDialogButtonBox(QDialogButtonBox.StandardButton.Close)
        bb.rejected.connect(self.reject)
        layout.addWidget(bb)

    def set_current_position(self, cx: float, cy: float):
        """Called by main window to provide the latest detected position."""
        self._latest_cx = cx
        self._latest_cy = cy

    def _on_capture1(self):
        cx = getattr(self, "_latest_cx", None)
        cy = getattr(self, "_latest_cy", None)
        if cx is None:
            self._status.setText("⚠ No position available yet. Start tracking first.")
            return
        self._pos_before = (cx, cy)
        self._status.setText(
            f"Position 1 captured: ({cx:.1f}, {cy:.1f})  "
            "→ Now slew EAST 5-15 arcmin, then click step 2."
        )
        self._btn2.setEnabled(True)

    def _on_capture2(self):
        cx = getattr(self, "_latest_cx", None)
        cy = getattr(self, "_latest_cy", None)
        if cx is None:
            return
        self._pos_after = (cx, cy)
        import math
        dx = cx - self._pos_before[0]
        dy = cy - self._pos_before[1]
        disp = math.sqrt(dx**2 + dy**2)
        self._status.setText(
            f"Position 2 captured: ({cx:.1f}, {cy:.1f})  Displacement: {disp:.1f} px"
        )
        self._btn_compute.setEnabled(True)

    def _on_compute(self):
        from core.coordinate_transform import compute_camera_rotation
        try:
            angle, uncertainty = compute_camera_rotation(
                self._pos_before, self._pos_after, "east"
            )
            self._cm.config.calibration.camera_rotation_deg = angle
            from datetime import date
            self._cm.config.calibration.calibration_date = date.today().isoformat()
            self._cm.save()
            self._status.setText(
                f"✓ Camera rotation: {angle:.2f}°  (±{uncertainty:.2f}°)  – Saved."
            )
        except Exception as e:
            self._status.setText(f"⚠ Error: {e}")

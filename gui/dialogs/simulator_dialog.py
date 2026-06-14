"""
gui/dialogs/simulator_dialog.py
=================================
GUI for the synthetic data generator.
"""
from __future__ import annotations
from pathlib import Path
from PyQt6.QtWidgets import (
    QComboBox, QDialog, QDialogButtonBox, QDoubleSpinBox,
    QFileDialog, QFormLayout, QHBoxLayout, QLabel,
    QLineEdit, QPushButton, QSpinBox, QVBoxLayout,
)
from config.config_manager import SdaaConfig


class SimulatorDialog(QDialog):
    def __init__(self, cfg: SdaaConfig, parent=None):
        super().__init__(parent)
        self._cfg = cfg
        self.setWindowTitle("Generate Test Data (Simulator)")
        self.setMinimumWidth(440)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        form = QFormLayout()

        self._scenario = QComboBox()
        self._scenario.addItems([
            "A – Perfect alignment",
            "B – Azimuth error",
            "C – Altitude error",
            "D – Combined Az+Alt",
            "E – Mid-session correction",
            "F – Poor seeing",
        ])
        form.addRow("Scenario:", self._scenario)

        self._az_err = QDoubleSpinBox(); self._az_err.setRange(0, 30); self._az_err.setSuffix(" ′")
        self._alt_err = QDoubleSpinBox(); self._alt_err.setRange(0, 30); self._alt_err.setSuffix(" ′")
        self._n_frames = QSpinBox(); self._n_frames.setRange(10, 1000); self._n_frames.setValue(120)
        self._interval = QDoubleSpinBox(); self._interval.setRange(1, 300); self._interval.setValue(15); self._interval.setSuffix(" s")
        self._seeing = QDoubleSpinBox(); self._seeing.setRange(0.5, 30); self._seeing.setValue(3); self._seeing.setSuffix(" ″")

        form.addRow("Azimuth error:", self._az_err)
        form.addRow("Altitude error:", self._alt_err)
        form.addRow("Frames:", self._n_frames)
        form.addRow("Interval:", self._interval)
        form.addRow("Seeing:", self._seeing)

        self._out_dir = QLineEdit(str(Path.home() / "sdaa_test_data"))
        row = QWidget(); hl = QHBoxLayout(row); hl.setContentsMargins(0,0,0,0)
        hl.addWidget(self._out_dir)
        btn = QPushButton("…"); btn.setMaximumWidth(30)
        btn.clicked.connect(self._browse)
        hl.addWidget(btn)
        form.addRow("Output folder:", row)
        layout.addLayout(form)

        self._status = QLabel("")
        layout.addWidget(self._status)

        bb = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        bb.accepted.connect(self._on_generate)
        bb.rejected.connect(self.reject)
        layout.addWidget(bb)

    def _browse(self):
        p = QFileDialog.getExistingDirectory(self, "Output folder", self._out_dir.text())
        if p: self._out_dir.setText(p)

    def _on_generate(self):
        from simulator.synthetic_generator import (
            Simulator, ScenarioA, ScenarioB, ScenarioC,
            ScenarioD, ScenarioE, ScenarioF,
        )
        idx = self._scenario.currentIndex()
        kwargs = dict(
            az_error_arcmin=self._az_err.value(),
            alt_error_arcmin=self._alt_err.value(),
            n_frames=self._n_frames.value(),
            interval_sec=self._interval.value(),
            seeing_arcsec=self._seeing.value(),
        )
        scenarios = [ScenarioA, ScenarioB, ScenarioC, ScenarioD, ScenarioE, ScenarioF]
        cls = scenarios[idx]
        try:
            s = cls(**{k: v for k, v in kwargs.items()
                       if k in cls.__dataclass_fields__})
        except Exception:
            s = cls()

        sim = Simulator(
            width=self._cfg.camera.sensor_width_px,
            height=self._cfg.camera.sensor_height_px,
            plate_scale=self._cfg.plate_scale_arcsec_px,
            camera_rotation=self._cfg.calibration.camera_rotation_deg,
        )
        out = Path(self._out_dir.text()) / s.name
        self._status.setText(f"Generating {s.n_frames} frames…")
        self.repaint()
        try:
            paths = sim.run_scenario(s, out, verbose=False)
            self._status.setText(f"✓ {len(paths)} frames written to {out}")
        except Exception as e:
            self._status.setText(f"⚠ Error: {e}")

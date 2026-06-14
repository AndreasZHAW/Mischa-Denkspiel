"""
gui/dialogs/setup_wizard.py
============================
First-run setup wizard (also accessible via Tools menu).
Covers: watch folder, camera specs, optics, observer location,
and a pre-flight safety checklist.
"""
from __future__ import annotations
from pathlib import Path
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (
    QCheckBox, QComboBox, QDialog, QDialogButtonBox, QDoubleSpinBox,
    QFileDialog, QFormLayout, QGroupBox, QHBoxLayout,
    QLabel, QLineEdit, QPushButton, QSpinBox,
    QTabWidget, QVBoxLayout, QWidget,
)
from config.config_manager import ConfigManager


class SetupWizard(QDialog):
    """
    Equipment & paths setup dialog.
    Shows a safety checklist on the first tab.
    """

    def __init__(self, config_manager: ConfigManager, parent=None):
        super().__init__(parent)
        self._cm  = config_manager
        self._cfg = config_manager.config
        self.setWindowTitle("SDAA Setup")
        self.setMinimumWidth(520)
        self._build_ui()
        self._populate()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        tabs = QTabWidget()
        layout.addWidget(tabs)

        tabs.addTab(self._build_checklist_tab(), "☑ Checklist")
        tabs.addTab(self._build_paths_tab(),     "📁 Paths")
        tabs.addTab(self._build_camera_tab(),    "📷 Camera")
        tabs.addTab(self._build_optics_tab(),    "🔭 Optics")
        tabs.addTab(self._build_observer_tab(),  "🌍 Observer")
        tabs.addTab(self._build_mount_tab(),     "🔩 Mount")

        bb = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        bb.accepted.connect(self._on_accept)
        bb.rejected.connect(self.reject)
        layout.addWidget(bb)

    def _build_checklist_tab(self):
        w = QWidget()
        layout = QVBoxLayout(w)
        hdr = QLabel("<b>Pre-flight checklist</b> – confirm before starting:")
        layout.addWidget(hdr)
        checks = [
            "Solar filter is securely attached",
            "Mount is powered on and tracking (solar rate recommended)",
            "FireCapture / NINA is configured to output FITS to the watch folder",
            "Camera rotation has been calibrated (run Tools → Camera Rotation Wizard)",
            "Sun is above 30° altitude (better refraction conditions)",
            "Capture interval: 1 frame every 10-30 seconds recommended",
        ]
        self._checklist: list[QCheckBox] = []
        for text in checks:
            cb = QCheckBox(text)
            self._checklist.append(cb)
            layout.addWidget(cb)
        layout.addStretch()
        return w

    def _build_paths_tab(self):
        w = QWidget()
        form = QFormLayout(w)

        self._watch_folder = QLineEdit()
        self._processed_folder = QLineEdit()
        self._sessions_folder = QLineEdit()

        for label, edit, attr in [
            ("Watch folder:", self._watch_folder, "watch_folder"),
            ("Processed folder:", self._processed_folder, "processed_folder"),
            ("Sessions folder:", self._sessions_folder, "sessions_folder"),
        ]:
            row = QWidget()
            hl = QHBoxLayout(row)
            hl.setContentsMargins(0,0,0,0)
            hl.addWidget(edit)
            btn = QPushButton("…")
            btn.setMaximumWidth(30)
            btn.clicked.connect(lambda _, e=edit: self._browse(e))
            hl.addWidget(btn)
            form.addRow(label, row)

        self._keep_files = QCheckBox(
            "Keep files in place (don't move them to the processed folder)"
        )
        self._keep_files.setChecked(True)
        self._keep_files.setToolTip(
            "Recommended for SharpCap. When enabled, your original FITS files\n"
            "stay where they are. When disabled, each capture subfolder (e.g.\n"
            "11_04_37) is moved to the processed folder after analysis."
        )
        form.addRow("", self._keep_files)
        return w

    def _build_camera_tab(self):
        w = QWidget()
        form = QFormLayout(w)
        self._pixel_size = QDoubleSpinBox()
        self._pixel_size.setRange(1.0, 20.0)
        self._pixel_size.setDecimals(2)
        self._pixel_size.setSuffix(" µm")
        self._sensor_w = QSpinBox(); self._sensor_w.setRange(100, 10000)
        self._sensor_h = QSpinBox(); self._sensor_h.setRange(100, 10000)
        form.addRow("Pixel size:", self._pixel_size)
        form.addRow("Sensor width (px):", self._sensor_w)
        form.addRow("Sensor height (px):", self._sensor_h)
        form.addRow(QLabel("<i>Bayer pattern is read from FITS header automatically.</i>"))
        return w

    def _build_optics_tab(self):
        w = QWidget()
        form = QFormLayout(w)
        self._focal_length = QDoubleSpinBox()
        self._focal_length.setRange(50, 5000)
        self._focal_length.setSuffix(" mm")
        self._reducer = QDoubleSpinBox()
        self._reducer.setRange(0.1, 5.0)
        self._reducer.setDecimals(2)
        self._reducer.setSingleStep(0.05)
        self._ps_label = QLabel("–")
        self._fov_label = QLabel("–")
        # Make derived values prominent
        big_font = QFont("Monospace", 11, QFont.Weight.Bold)
        self._ps_label.setFont(big_font)
        self._ps_label.setStyleSheet("color: #a6e3a1;")
        self._fov_label.setFont(QFont("Monospace", 10))
        self._fov_label.setStyleSheet("color: #89b4fa;")

        self._focal_length.valueChanged.connect(self._update_derived)
        self._reducer.valueChanged.connect(self._update_derived)
        # Also update when sensor size changes
        self._sensor_w.valueChanged.connect(self._update_derived)
        self._sensor_h.valueChanged.connect(self._update_derived)
        self._pixel_size.valueChanged.connect(self._update_derived)

        form.addRow("Focal length:", self._focal_length)
        form.addRow("Reducer / Barlow factor:", self._reducer)
        form.addRow(QLabel(""))   # spacer
        form.addRow("→ Plate scale:", self._ps_label)
        form.addRow("→ Field of view:", self._fov_label)
        return w

    def _build_observer_tab(self):
        w = QWidget()
        layout = QVBoxLayout(w)
        hint = QLabel(
            "<i>Used to compute the sun's hour angle for the drift-to-error "
            "conversion. Accuracy of ±50 km is fine. Quick presets below.</i>"
        )
        hint.setWordWrap(True)
        layout.addWidget(hint)

        form = QFormLayout()
        self._lat = QDoubleSpinBox(); self._lat.setRange(-90, 90); self._lat.setDecimals(4)
        self._lon = QDoubleSpinBox(); self._lon.setRange(-180, 180); self._lon.setDecimals(4)
        self._alt_m = QDoubleSpinBox(); self._alt_m.setRange(0, 8000); self._alt_m.setSuffix(" m")
        form.addRow("Latitude (°):", self._lat)
        form.addRow("Longitude (°):", self._lon)
        form.addRow("Altitude:", self._alt_m)
        layout.addLayout(form)

        # Preset buttons
        from PyQt6.QtWidgets import QPushButton, QHBoxLayout as _HL
        presets = QHBoxLayout()
        presets.addWidget(QLabel("Preset:"))
        for name, lat, lon, alt in [
            ("Zürich",  47.3769,  8.5417, 408),
            ("Avignon", 43.9493,  4.8055,  23),
        ]:
            btn = QPushButton(name)
            btn.clicked.connect(lambda _, la=lat, lo=lon, al=alt: self._apply_preset(la, lo, al))
            presets.addWidget(btn)
        presets.addStretch()
        layout.addLayout(presets)
        layout.addStretch()
        return w

    def _apply_preset(self, lat: float, lon: float, alt: float) -> None:
        self._lat.setValue(lat)
        self._lon.setValue(lon)
        self._alt_m.setValue(alt)

    def _build_mount_tab(self):
        w = QWidget()
        layout = QVBoxLayout(w)
        layout.setSpacing(10)

        # --- Screw calibration ---
        grp_screw = QGroupBox("Screw calibration (EQ6-R Pro defaults)")
        form_s = QFormLayout(grp_screw)

        self._az_per_turn = QDoubleSpinBox()
        self._az_per_turn.setRange(1, 360); self._az_per_turn.setDecimals(1)
        self._az_per_turn.setSuffix(" arcmin/turn")
        self._az_per_turn.setValue(30.0)
        form_s.addRow("Az screw arcmin/turn:", self._az_per_turn)

        self._alt_per_turn = QDoubleSpinBox()
        self._alt_per_turn.setRange(1, 360); self._alt_per_turn.setDecimals(1)
        self._alt_per_turn.setSuffix(" arcmin/turn")
        self._alt_per_turn.setValue(30.0)
        form_s.addRow("Alt screw arcmin/turn:", self._alt_per_turn)

        self._az_right_dir = QComboBox()
        self._az_right_dir.addItems(["east", "west"])
        form_s.addRow("Right Az screw direction:", self._az_right_dir)
        layout.addWidget(grp_screw)

        # --- Direction inversion ---
        grp_inv = QGroupBox("Correction direction — invert if suggested direction appears backwards")
        vbox_inv = QVBoxLayout(grp_inv)
        self._invert_az = QCheckBox(
            "Invert Az direction  (East ↔ West)\n"
            "Enable if 'tighten LEFT' appears but mount needs to go RIGHT (or vice versa)"
        )
        self._invert_alt = QCheckBox(
            "Invert Alt direction  (Up ↔ Down)\n"
            "Enable if 'tighten UP' appears but mount needs to go DOWN (or vice versa)"
        )
        note = QLabel(
            "Tip: if both axes are wrong → enable both (camera rotated 180°).\n"
            "If only one is wrong → enable only that one (camera rotated 90°)."
        )
        note.setStyleSheet("color: #6c7086; font-size: 8pt;")
        vbox_inv.addWidget(self._invert_az)
        vbox_inv.addWidget(self._invert_alt)
        vbox_inv.addWidget(note)

        # Reference pier side for the invert flags
        ref_row = QFormLayout()
        self._invert_ref_pier = QComboBox()
        self._invert_ref_pier.addItems(["WEST", "EAST"])
        ref_row.addRow("Invert flags calibrated for pier side:", self._invert_ref_pier)
        ref_note = QLabel(
            "On the opposite pier side, both inversions auto-toggle (meridian flip = 180°)."
        )
        ref_note.setStyleSheet("color: #6c7086; font-size: 8pt;")
        vbox_inv.addLayout(ref_row)
        vbox_inv.addWidget(ref_note)

        # Manual pier-side override (SharpCap doesn't write PIERSIDE)
        pier_row = QFormLayout()
        self._pier_override = QComboBox()
        self._pier_override.addItems(["AUTO", "WEST", "EAST"])
        pier_row.addRow("Pier side (if no FITS header):", self._pier_override)
        pier_note = QLabel(
            "SharpCap usually doesn't write PIERSIDE. If directions are wrong,\n"
            "set this to the side your mount was actually on (WEST = before flip)."
        )
        pier_note.setStyleSheet("color: #6c7086; font-size: 8pt;")
        vbox_inv.addLayout(pier_row)
        vbox_inv.addWidget(pier_note)
        layout.addWidget(grp_inv)

        # --- Display options ---
        grp_disp = QGroupBox("Display")
        vbox_disp = QVBoxLayout(grp_disp)
        self._show_arrow = QCheckBox(
            "Show drift-direction arrow on live view\n"
            "(thin line from the sun to the frame edge showing where it's heading)"
        )
        self._show_arrow.setChecked(True)
        vbox_disp.addWidget(self._show_arrow)
        layout.addWidget(grp_disp)

        layout.addStretch()
        return w

    def _populate(self):
        cfg = self._cfg
        self._watch_folder.setText(cfg.paths.watch_folder)
        self._keep_files.setChecked(cfg.paths.keep_files_in_place)
        self._processed_folder.setText(cfg.paths.processed_folder)
        self._sessions_folder.setText(cfg.paths.sessions_folder)
        self._pixel_size.setValue(cfg.camera.pixel_size_um)
        self._sensor_w.setValue(cfg.camera.sensor_width_px)
        self._sensor_h.setValue(cfg.camera.sensor_height_px)
        self._focal_length.setValue(cfg.optics.focal_length_mm)
        self._reducer.setValue(cfg.optics.reducer_factor)
        self._lat.setValue(cfg.observer.latitude_deg)
        self._lon.setValue(cfg.observer.longitude_deg)
        self._alt_m.setValue(cfg.observer.altitude_m)
        # Mount tab
        self._az_per_turn.setValue(cfg.mount_adjust.az_arcmin_per_turn)
        self._alt_per_turn.setValue(cfg.mount_adjust.alt_arcmin_per_turn)
        idx = self._az_right_dir.findText(cfg.mount_adjust.az_right_screw_direction)
        if idx >= 0:
            self._az_right_dir.setCurrentIndex(idx)
        self._invert_az.setChecked(
            cfg.mount_adjust.invert_az_direction or cfg.mount_adjust.invert_correction_directions
        )
        self._invert_alt.setChecked(
            cfg.mount_adjust.invert_alt_direction or cfg.mount_adjust.invert_correction_directions
        )
        self._show_arrow.setChecked(cfg.gui.show_drift_arrow)
        idx_p = self._invert_ref_pier.findText(
            (cfg.mount_adjust.invert_reference_pier_side or "WEST").upper()
        )
        if idx_p >= 0:
            self._invert_ref_pier.setCurrentIndex(idx_p)
        idx_po = self._pier_override.findText(
            (cfg.mount_adjust.pier_side_override or "AUTO").upper()
        )
        if idx_po >= 0:
            self._pier_override.setCurrentIndex(idx_po)
        self._update_derived()

    def _update_derived(self):
        fl = self._focal_length.value() * self._reducer.value()
        ps = 206265.0 * (self._pixel_size.value() / 1000.0) / fl if fl > 0 else 0
        w_as = ps * self._sensor_w.value() / 60.0   # arcmin
        h_as = ps * self._sensor_h.value() / 60.0
        self._ps_label.setText(f"{ps:.3f} arcsec/px")
        self._fov_label.setText(f"{w_as:.1f}′ × {h_as:.1f}′")

    def _browse(self, edit: QLineEdit):
        path = QFileDialog.getExistingDirectory(self, "Select folder", edit.text())
        if path:
            edit.setText(path)

    def _on_accept(self):
        cfg = self._cfg
        cfg.paths.watch_folder     = self._watch_folder.text()
        cfg.paths.keep_files_in_place = self._keep_files.isChecked()
        cfg.paths.processed_folder = self._processed_folder.text()
        cfg.paths.sessions_folder  = self._sessions_folder.text()
        cfg.camera.pixel_size_um    = self._pixel_size.value()
        cfg.camera.sensor_width_px  = self._sensor_w.value()
        cfg.camera.sensor_height_px = self._sensor_h.value()
        cfg.optics.focal_length_mm  = self._focal_length.value()
        cfg.optics.reducer_factor   = self._reducer.value()
        cfg.observer.latitude_deg   = self._lat.value()
        cfg.observer.longitude_deg  = self._lon.value()
        cfg.observer.altitude_m     = self._alt_m.value()
        # Mount tab
        cfg.mount_adjust.az_arcmin_per_turn           = self._az_per_turn.value()
        cfg.mount_adjust.alt_arcmin_per_turn          = self._alt_per_turn.value()
        cfg.mount_adjust.az_right_screw_direction     = self._az_right_dir.currentText()
        cfg.mount_adjust.invert_az_direction          = self._invert_az.isChecked()
        cfg.mount_adjust.invert_alt_direction         = self._invert_alt.isChecked()
        cfg.mount_adjust.invert_correction_directions = False  # superseded by per-axis flags
        cfg.gui.show_drift_arrow = self._show_arrow.isChecked()
        cfg.mount_adjust.invert_reference_pier_side = self._invert_ref_pier.currentText()
        cfg.mount_adjust.pier_side_override = self._pier_override.currentText()

        # If no config path set yet, default to sessions_folder/sdaa_config.yaml
        # This way settings persist across restarts.
        if self._cm.config_path is None:
            from pathlib import Path
            target = Path(cfg.paths.sessions_folder) / "sdaa_config.yaml"
            self._cm.save(target)
            self._cm._config_path = target   # remember for future saves
        else:
            self._cm.save()
        self.accept()

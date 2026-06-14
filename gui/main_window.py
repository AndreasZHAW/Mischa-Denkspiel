"""
gui/main_window.py
===================
Main application window for SDAA.

Layout:
  ┌─────────────────────────────────────────────────┐
  │  Menu Bar                                        │
  │  Toolbar  (Start │ Stop │ Reset │ Save │ Setup)  │
  ├────────────────┬────────────────────────────────┤
  │                │  Drift Plot Panel              │
  │  Live View     ├────────────────────────────────┤
  │  Panel         │  Polar Error Panel             │
  │                ├────────────────────────────────┤
  │                │  Correction Panel              │
  ├────────────────┴────────────────────────────────┤
  │  Quality Indicator Bar          Status Bar       │
  └─────────────────────────────────────────────────┘

Threading model:
  - ProcessingWorker (QThread) runs file watching + image pipeline
  - Emits Qt signals with results → GUI updates in main thread
  - Auto-reset countdown runs in a QTimer in the main thread
"""

from __future__ import annotations

import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import numpy as np
from PyQt6.QtCore import (
    Qt, QThread, QTimer, pyqtSignal, pyqtSlot,
)
from PyQt6.QtGui import QAction, QFont, QIcon, QKeySequence
from PyQt6.QtWidgets import (
    QApplication, QDockWidget, QHBoxLayout, QLabel,
    QMainWindow, QMessageBox, QProgressBar, QPushButton,
    QSizePolicy, QSplitter, QStatusBar, QToolBar,
    QVBoxLayout, QWidget,
)

from version import VERSION_STRING
from config.config_manager import ConfigManager, SdaaConfig
from core.tracking_engine import TrackPoint, PointStatus
from core.drift_solver import DriftSolution
from core.polar_alignment_solver import PolarError
from gui.panels.live_view_panel import LiveViewPanel
from gui.panels.drift_plot_panel import DriftPlotPanel
from gui.panels.polar_error_panel import PolarErrorPanel  # noqa: F401  (kept for backward import)
from gui.panels.correction_panel import CorrectionPanel
from gui.panels.quality_panel import QualityPanel
from gui.panels.log_panel import LogPanel
from gui.worker import ProcessingWorker

logger = logging.getLogger(__name__)


class MainWindow(QMainWindow):
    """SDAA main window."""

    def __init__(self, config_manager: ConfigManager) -> None:
        super().__init__()
        self._cm  = config_manager
        self._cfg = config_manager.config

        self._worker: Optional[ProcessingWorker] = None
        self._tracking = False
        self._auto_reset_timer: Optional[QTimer] = None
        self._auto_reset_countdown = 0
        self._last_track_point: Optional[TrackPoint] = None

        self._setup_window()
        self._build_ui()
        self._build_toolbar()
        self._build_menu()
        self._build_status_bar()
        self._apply_theme()

        # Log startup
        logger.info("SDAA %s started", VERSION_STRING)

    # ------------------------------------------------------------------ setup

    def _setup_window(self) -> None:
        self.setWindowTitle(VERSION_STRING)
        self.resize(1500, 1000)
        self.setMinimumSize(900, 600)

    def _build_ui(self) -> None:
        central = QWidget()
        self.setCentralWidget(central)
        root_layout = QVBoxLayout(central)
        root_layout.setContentsMargins(4, 4, 4, 4)
        root_layout.setSpacing(4)

        # Main horizontal splitter: live view | right panels
        main_splitter = QSplitter(Qt.Orientation.Horizontal)
        main_splitter.setChildrenCollapsible(False)

        # --- Left: Live View ---
        self.live_view = LiveViewPanel()
        self.live_view.setMinimumWidth(400)
        main_splitter.addWidget(self.live_view)

        # --- Right: stacked panels ---
        right_splitter = QSplitter(Qt.Orientation.Vertical)
        right_splitter.setChildrenCollapsible(False)

        self.drift_plot   = DriftPlotPanel()
        self.correction   = CorrectionPanel()

        right_splitter.addWidget(self.drift_plot)
        right_splitter.addWidget(self.correction)
        right_splitter.setSizes([400, 300])

        main_splitter.addWidget(right_splitter)
        main_splitter.setSizes([600, 700])

        # Outer vertical splitter: main area | log
        outer_splitter = QSplitter(Qt.Orientation.Vertical)
        outer_splitter.setChildrenCollapsible(False)
        outer_splitter.addWidget(main_splitter)

        # --- Bottom: Quality indicator + Log ---
        bottom_widget = QWidget()
        bottom_layout = QVBoxLayout(bottom_widget)
        bottom_layout.setContentsMargins(0, 0, 0, 0)
        bottom_layout.setSpacing(2)
        self.quality_panel = QualityPanel()
        bottom_layout.addWidget(self.quality_panel)
        self.log_panel = LogPanel()
        bottom_layout.addWidget(self.log_panel, 1)
        outer_splitter.addWidget(bottom_widget)
        outer_splitter.setSizes([600, 250])

        root_layout.addWidget(outer_splitter)

        # Initialise the rotation display with whatever's in the config
        cfg_rot = self._cfg.calibration.camera_rotation_deg
        if abs(cfg_rot) > 1e-6:
            self.correction.update_rotation(cfg_rot, source="config")
        else:
            self.correction.update_rotation(None)

    def _build_toolbar(self) -> None:
        tb = QToolBar("Main Toolbar")
        tb.setMovable(False)
        tb.setToolButtonStyle(Qt.ToolButtonStyle.ToolButtonTextBesideIcon)
        self.addToolBar(tb)

        # Start
        self._act_start = QAction("▶  Start", self)
        self._act_start.setShortcut(QKeySequence("F5"))
        self._act_start.setToolTip("Start live tracking  [F5]")
        self._act_start.triggered.connect(self._on_start)
        tb.addAction(self._act_start)

        # Stop
        self._act_stop = QAction("■  Stop", self)
        self._act_stop.setShortcut(QKeySequence("F6"))
        self._act_stop.setEnabled(False)
        self._act_stop.triggered.connect(self._on_stop)
        tb.addAction(self._act_stop)

        tb.addSeparator()

        # Reset drift
        self._act_reset = QAction("↺  Reset Drift", self)
        self._act_reset.setShortcut(QKeySequence("Ctrl+R"))
        self._act_reset.setEnabled(False)
        self._act_reset.triggered.connect(self._on_manual_reset)
        tb.addAction(self._act_reset)

        tb.addSeparator()

        # Save session
        self._act_save = QAction("💾  Save Session", self)
        self._act_save.setShortcut(QKeySequence("Ctrl+S"))
        self._act_save.triggered.connect(self._on_save)
        tb.addAction(self._act_save)

        tb.addSeparator()

        # Setup
        self._act_setup = QAction("⚙  Setup", self)
        self._act_setup.triggered.connect(self._on_setup)
        tb.addAction(self._act_setup)

        # Spacer to push version label right
        spacer = QWidget()
        spacer.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Preferred)
        tb.addWidget(spacer)

        # Version label
        ver_label = QLabel(f"  {VERSION_STRING}  ")
        ver_label.setFont(QFont("Monospace", 9))
        tb.addWidget(ver_label)

    def _build_menu(self) -> None:
        mb = self.menuBar()

        # File
        file_menu = mb.addMenu("&File")
        file_menu.addAction(self._act_start)
        file_menu.addAction(self._act_stop)
        file_menu.addSeparator()
        file_menu.addAction(self._act_save)

        act_open = QAction("Open Session…", self)
        act_open.setShortcut(QKeySequence("Ctrl+O"))
        act_open.triggered.connect(self._on_open_session)
        file_menu.addAction(act_open)

        file_menu.addSeparator()
        act_quit = QAction("Quit", self)
        act_quit.setShortcut(QKeySequence("Ctrl+Q"))
        act_quit.triggered.connect(self.close)
        file_menu.addAction(act_quit)

        # Tools
        tools_menu = mb.addMenu("&Tools")
        tools_menu.addAction(self._act_setup)
        tools_menu.addAction(self._act_reset)

        act_calib = QAction("Camera Rotation Wizard (Stars)…", self)
        act_calib.triggered.connect(self._on_calibration_wizard)
        tools_menu.addAction(act_calib)

        act_rot_test = QAction("Derive Rotation from Test Data…", self)
        act_rot_test.triggered.connect(self._on_rotation_from_testdata)
        tools_menu.addAction(act_rot_test)

        act_sim = QAction("Generate Test Data (Simulator)…", self)
        act_sim.triggered.connect(self._on_simulator)
        tools_menu.addAction(act_sim)

        # Help
        help_menu = mb.addMenu("&Help")
        act_about = QAction("About SDAA…", self)
        act_about.triggered.connect(self._on_about)
        help_menu.addAction(act_about)

        act_tips = QAction("Tips for better accuracy…", self)
        act_tips.triggered.connect(self._on_accuracy_tips)
        help_menu.addAction(act_tips)

    def _build_status_bar(self) -> None:
        sb = QStatusBar()
        self.setStatusBar(sb)
        self._status_main  = QLabel("Ready.  Click ▶ Start to begin tracking.")
        self._status_frames = QLabel("Frames: 0")
        self._status_queue  = QLabel("Queue: 0")
        sb.addWidget(self._status_main, 1)
        sb.addPermanentWidget(self._status_frames)
        sb.addPermanentWidget(self._status_queue)

    def _apply_theme(self) -> None:
        theme = self._cfg.gui.theme
        if theme == "dark":
            self.setStyleSheet("""
                QMainWindow, QWidget { background: #1e1e2e; color: #cdd6f4; }
                QToolBar { background: #181825; border-bottom: 1px solid #313244; spacing: 4px; }
                QMenuBar  { background: #181825; color: #cdd6f4; }
                QMenuBar::item:selected { background: #313244; }
                QMenu { background: #1e1e2e; border: 1px solid #45475a; }
                QMenu::item:selected { background: #313244; }
                QSplitter::handle { background: #313244; }
                QStatusBar { background: #181825; color: #a6adc8; }
                QPushButton {
                    background: #313244; color: #cdd6f4;
                    border: 1px solid #45475a; border-radius: 4px; padding: 4px 10px;
                }
                QPushButton:hover    { background: #45475a; }
                QPushButton:pressed  { background: #585b70; }
                QPushButton:disabled { color: #585b70; }
                QLabel { color: #cdd6f4; }
            """)

    # ----------------------------------------------------------------- slots

    @pyqtSlot()
    def _on_start(self) -> None:
        if self._tracking:
            return
        self._tracking = True
        self._act_start.setEnabled(False)
        self._act_stop.setEnabled(True)
        self._act_reset.setEnabled(True)

        self._worker = ProcessingWorker(self._cm)
        self._worker.new_frame.connect(self._on_new_frame)
        self._worker.drift_updated.connect(self._on_drift_updated)
        self._worker.polar_updated.connect(self._on_polar_updated)
        self._worker.tracking_updated.connect(self._on_tracking_updated)
        self._worker.sunspot_updated.connect(self._on_sunspot_updated)
        self._worker.sdo_result.connect(self._on_sdo_result)
        self._worker.auto_reset_detected.connect(self._on_auto_reset_detected)
        self._worker.error_occurred.connect(self._on_worker_error)
        self._worker.status_message.connect(self._on_status_message)
        self._worker.start()

        self._status_main.setText("Tracking…  waiting for images.")

    @pyqtSlot()
    def _on_stop(self) -> None:
        self._tracking = False
        self._act_start.setEnabled(True)
        self._act_stop.setEnabled(False)
        if self._worker:
            self._worker.stop()
            self._worker = None
        self._status_main.setText("Stopped.")

    @pyqtSlot()
    def _on_manual_reset(self) -> None:
        """Full reset: stop the current worker, clear all UI, restart the worker.

        This ensures that:
        - The FileWatcher re-scans the (possibly new) watch folder from scratch.
        - All tracking points, frame counts, and polar solver cache are cleared.
        - If the user changed the watch folder in Setup, the new folder is picked up.
        """
        was_tracking = self._tracking

        # 1. Stop worker completely (clears FileWatcher, all queues)
        if self._worker:
            self._worker.stop()
            self._worker = None
        self._tracking = False

        # 2. Clear all UI panels
        self.drift_plot.clear()
        self.correction.clear()
        self.live_view.clear()
        self._last_track_point = None
        self._status_frames.setText("Frames: 0")
        self._status_queue.setText("Queue: 0")
        self._status_main.setText("Drift reset — restarting…")

        # 3. Restart worker if we were tracking
        if was_tracking:
            self._on_start()
            self._status_main.setText("Drift reset. Tracking restarted.")

    @pyqtSlot()
    def _on_save(self) -> None:
        if self._worker:
            self._worker.save_session()
            self._status_main.setText("Session saved.")

    @pyqtSlot()
    def _on_setup(self) -> None:
        from gui.dialogs.setup_wizard import SetupWizard
        wizard = SetupWizard(self._cm, parent=self)
        if wizard.exec():
            self._cfg = self._cm.config
            self._status_main.setText("Setup updated.")

    @pyqtSlot()
    def _on_open_session(self) -> None:
        from PyQt6.QtWidgets import QFileDialog
        path, _ = QFileDialog.getOpenFileName(
            self, "Open Session", str(Path(self._cfg.paths.sessions_folder)),
            "SDAA Sessions (*.json)"
        )
        if path:
            if self._worker:
                self._worker.load_session(Path(path))
            else:
                # Post-processing mode: start worker in replay mode
                self._worker = ProcessingWorker(self._cm, replay_path=Path(path))
                self._worker.new_frame.connect(self._on_new_frame)
                self._worker.drift_updated.connect(self._on_drift_updated)
                self._worker.polar_updated.connect(self._on_polar_updated)
                self._worker.status_message.connect(self._on_status_message)
                self._worker.start()

    @pyqtSlot()
    def _on_calibration_wizard(self) -> None:
        from gui.dialogs.calibration_wizard import CalibrationWizard
        wiz = CalibrationWizard(self._cm, parent=self)
        wiz.exec()

    @pyqtSlot()
    def _on_rotation_from_testdata(self) -> None:
        from gui.dialogs.rotation_wizard import RotationWizard
        wiz = RotationWizard(self._cm, parent=self)
        wiz.exec()

    @pyqtSlot()
    def _on_simulator(self) -> None:
        from gui.dialogs.simulator_dialog import SimulatorDialog
        dlg = SimulatorDialog(self._cfg, parent=self)
        dlg.exec()

    @pyqtSlot()
    def _on_about(self) -> None:
        QMessageBox.about(
            self,
            "About SDAA",
            f"<b>{VERSION_STRING}</b><br><br>"
            "Solar Drift Alignment Analyzer<br>"
            "Polar alignment via daytime solar drift measurement.<br><br>"
            "Designed for EQ6 / EQMod setups with FMA180 or similar optics.",
        )

    @pyqtSlot()
    def _on_accuracy_tips(self) -> None:
        QMessageBox.information(
            self,
            "Tips for better accuracy",
            "<b>How to improve polar alignment accuracy:</b><br><br>"
            "1. <b>Measure longer</b> – 20-30 min gives much better accuracy than 5 min.<br>"
            "2. <b>Avoid low sun</b> – atmospheric refraction below 30° reduces accuracy.<br>"
            "3. <b>Run camera rotation wizard</b> – uncalibrated rotation mixes RA/Dec components.<br>"
            "4. <b>Use FITS format</b> – exact timestamps from header (not filename/mtime).<br>"
            "5. <b>Check solar filter quality</b> – poor contrast = poor limb detection.<br>"
            "6. <b>Iterate</b> – correct the largest error first, then re-measure.<br>"
            "7. <b>Sun near meridian</b> – best geometry for azimuth correction.<br>"
            "8. <b>Sun 3h from meridian</b> – best geometry for altitude correction.",
        )

    # ---------------------------------------------------------------- worker signals

    @pyqtSlot(object, object)
    def _on_new_frame(self, track_point: TrackPoint, display_image: np.ndarray) -> None:
        self._last_track_point = track_point   # for sun-in-frame estimate
        self.live_view.update_frame(display_image, track_point)
        self.quality_panel.update(track_point)
        total = self._worker.n_frames if self._worker else 0
        self._status_frames.setText(f"Frames: {total}")
        queue_len = self._worker.queue_length if self._worker else 0
        self._status_queue.setText(f"Queue: {queue_len}")

    @pyqtSlot(object)
    def _on_drift_updated(self, sol: DriftSolution) -> None:
        self.drift_plot.update_solution(sol)
        # Use the latest known sun position + drift rate to compute how long
        # until the sun walks out of the frame.
        if sol.solution_valid and self._last_track_point is not None:
            tp = self._last_track_point
            # Use the ACTUAL image dimensions (from the frame), not the
            # configured sensor size — the captured FITS may be cropped/binned.
            img_w = tp.image_w if tp.image_w > 0 else self._cfg.camera.sensor_width_px
            img_h = tp.image_h if tp.image_h > 0 else self._cfg.camera.sensor_height_px
            self.live_view.update_sun_in_frame_estimate(
                sun_cx        = tp.cx_px,
                sun_cy        = tp.cy_px,
                sun_radius_px = tp.radius_px,
                image_w       = img_w,
                image_h       = img_h,
                drift_x_px_min= sol.drift_x_px_min,
                drift_y_px_min= sol.drift_y_px_min,
            )

    @pyqtSlot(object)
    def _on_tracking_updated(self, points) -> None:
        """All tracking points changed – update scatter+fit on Position tab."""
        self.drift_plot.update_from_tracking(points, self._cfg.plate_scale_arcsec_px)

    @pyqtSlot(object)
    def _on_sunspot_updated(self, payload) -> None:
        """Independent sunspot-correlation drift update."""
        self.drift_plot.update_sunspot(payload, self._cfg.plate_scale_arcsec_px)

    @pyqtSlot(object)
    def _on_sdo_result(self, result) -> None:
        """SDO reference comparison finished — show image + result in the SDO tab.

        The image is always shown (so the user can confirm what was downloaded);
        the textual rotation result is shown only when correlation is reasonable.
        """
        from pathlib import Path
        cache_path = Path.home() / "sdaa_cache" / "sdo_reference.jpg"

        if result is None:
            self.live_view.show_sdo_reference(
                None, message="no internet and no cache",
            )
            return

        ok = bool(getattr(result, "success", False))
        rot  = getattr(result, "rotation_deg",     None) if ok else None
        corr = getattr(result, "correlation_peak", None)
        age  = getattr(result, "reference_age_min", None)
        msg  = getattr(result, "message", "") if not ok else ""

        # NOTE: the SDO rotation finder now measures the TRUE camera rotation
        # directly from the image (two-stage global search), so no manual 180°
        # correction is applied here.  A meridian-flipped dataset will correctly
        # report ~+167° instead of -14°.

        self.live_view.show_sdo_reference(
            cache_path,
            rotation_deg=rot,
            correlation=corr,
            age_min=age,
            message=msg,
        )

        # Status-bar notification
        if ok:
            display_rot = rot if rot is not None else result.rotation_deg
            self._status_main.setText(
                f"SDO comparison: camera rotation ≈ {display_rot:+.1f}° "
                f"(correlation {result.correlation_peak:.2f})"
            )
            self.correction.update_rotation(
                display_rot, source="SDO", correlation=corr,
            )
        elif corr is not None:
            self._status_main.setText(
                f"SDO image loaded — correlation low ({corr:.2f}), rotation "
                f"not reliable.  See SDO tab to compare manually."
            )

    @pyqtSlot(object)
    def _on_polar_updated(self, err: PolarError) -> None:
        self.correction.update_correction(err)

    @pyqtSlot()
    def _on_auto_reset_detected(self) -> None:
        """Show a banner and start 30-second countdown before auto-reset."""
        # Ignore further triggers while a reset is already pending
        if self._auto_reset_timer is not None and self._auto_reset_timer.isActive():
            return

        self._auto_reset_countdown = self._cfg.drift.auto_reset_countdown_sec
        self._update_auto_reset_status()
        self._auto_reset_timer = QTimer(self)
        self._auto_reset_timer.setInterval(1000)
        self._auto_reset_timer.timeout.connect(self._auto_reset_tick)
        self._auto_reset_timer.start()

    def _auto_reset_tick(self) -> None:
        self._auto_reset_countdown -= 1
        self._update_auto_reset_status()
        if self._auto_reset_countdown <= 0:
            if self._auto_reset_timer:
                self._auto_reset_timer.stop()
                self._auto_reset_timer = None
            if self._worker:
                self._worker.reset_drift()
            self.drift_plot.clear()
            self._status_main.setText("Auto-reset complete.  Drift curve restarted.")

    def _update_auto_reset_status(self) -> None:
        self._status_main.setText(
            f"⚠ Mount movement detected!  "
            f"Drift will reset in {self._auto_reset_countdown}s  "
            f"– press [Ctrl+R] to cancel"
        )

    @pyqtSlot(str)
    def _on_worker_error(self, message: str) -> None:
        self._status_main.setText(f"⚠ {message}")
        logger.error("Worker error: %s", message)

    @pyqtSlot(str)
    def _on_status_message(self, message: str) -> None:
        self._status_main.setText(message)

    # ---------------------------------------------------------------- close

    def closeEvent(self, event) -> None:
        if self._worker and self._worker.isRunning():
            self._worker.stop()
            self._worker.wait(3000)
        event.accept()

"""
gui/panels/quality_panel.py
=============================
Horizontal bar showing per-frame quality score + running statistics.
"""
from __future__ import annotations
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import QHBoxLayout, QLabel, QProgressBar, QWidget
from core.tracking_engine import TrackPoint, PointStatus

class QualityPanel(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(4, 2, 4, 2)

        layout.addWidget(QLabel("Frame quality:"))
        self._bar = QProgressBar()
        self._bar.setRange(0, 100)
        self._bar.setMaximumHeight(14)
        layout.addWidget(self._bar, 1)

        self._stats = QLabel("–")
        self._stats.setFont(QFont("Monospace", 8))
        layout.addWidget(self._stats)

        self._n_ok = self._n_out = self._n_low = 0

    def update(self, tp: TrackPoint) -> None:
        pct = int(tp.quality * 100)
        self._bar.setValue(pct)

        if tp.status == PointStatus.OK:           self._n_ok  += 1
        elif tp.status == PointStatus.OUTLIER:    self._n_out += 1
        elif tp.status == PointStatus.LOW_QUALITY: self._n_low += 1

        colour = "#a6e3a1" if pct > 60 else "#fab387" if pct > 35 else "#f38ba8"
        self._bar.setStyleSheet(
            f"QProgressBar::chunk {{ background: {colour}; }} "
            "QProgressBar { text-align: center; border: 1px solid #45475a; border-radius: 3px; }"
        )
        self._stats.setText(
            f"ok:{self._n_ok}  low:{self._n_low}  outlier:{self._n_out}"
        )

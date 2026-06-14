"""
gui/panels/polar_error_panel.py
================================
Shows the Az/Alt polar error as large numbers + a simple compass indicator.
"""
from __future__ import annotations
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import QGridLayout, QLabel, QWidget

from core.polar_alignment_solver import PolarError


class PolarErrorPanel(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        grid = QGridLayout(self)
        grid.setContentsMargins(8, 4, 8, 4)

        hdr = QLabel("Polar Alignment Error")
        hdr.setFont(QFont("Sans", 9, QFont.Weight.Bold))
        grid.addWidget(hdr, 0, 0, 1, 2)

        self._az_val  = self._big_label("–")
        self._alt_val = self._big_label("–")
        self._tot_val = self._big_label("–")

        grid.addWidget(QLabel("Azimuth:"),   1, 0)
        grid.addWidget(self._az_val,          1, 1)
        grid.addWidget(QLabel("Altitude:"),   2, 0)
        grid.addWidget(self._alt_val,          2, 1)
        grid.addWidget(QLabel("Total:"),       3, 0)
        grid.addWidget(self._tot_val,          3, 1)

        self._msg_label = QLabel("")
        self._msg_label.setFont(QFont("Monospace", 8))
        self._msg_label.setWordWrap(True)
        grid.addWidget(self._msg_label, 4, 0, 1, 2)

    @staticmethod
    def _big_label(text: str) -> QLabel:
        lbl = QLabel(text)
        lbl.setFont(QFont("Monospace", 14, QFont.Weight.Bold))
        lbl.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        return lbl

    def update_error(self, err: PolarError) -> None:
        if not err.solution_valid:
            self._az_val.setText("–")
            self._alt_val.setText("–")
            self._tot_val.setText("–")
            self._msg_label.setText(err.message)
            return

        def _col(val: float) -> str:
            if abs(val) < 1.0:   return "#a6e3a1"   # green: < 1′
            if abs(val) < 5.0:   return "#fab387"   # orange: 1-5′
            return "#f38ba8"                         # red: > 5′

        self._az_val.setText(f"{err.azimuth_arcmin:+.1f}′  {err.az_direction}")
        self._az_val.setStyleSheet(f"color:{_col(err.azimuth_arcmin)};")
        self._alt_val.setText(f"{err.altitude_arcmin:+.1f}′  {err.alt_direction}")
        self._alt_val.setStyleSheet(f"color:{_col(err.altitude_arcmin)};")
        self._tot_val.setText(f"{err.total_arcmin:.1f}′")
        self._tot_val.setStyleSheet(f"color:{_col(err.total_arcmin)};")
        self._msg_label.setText(err.message)

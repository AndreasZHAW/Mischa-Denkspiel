"""
gui/panels/log_panel.py
========================
Live log viewer panel.  Attaches a logging handler that forwards records into
a QPlainTextEdit, with colour by level.

The panel can be saved to file for debugging and reporting.
"""
from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path

from PyQt6.QtCore import Qt, pyqtSignal, QObject
from PyQt6.QtGui import QColor, QFont, QTextCharFormat, QTextCursor
from PyQt6.QtWidgets import (
    QFileDialog, QHBoxLayout, QLabel, QPlainTextEdit,
    QPushButton, QVBoxLayout, QWidget, QComboBox,
)


_LEVEL_COLORS = {
    "DEBUG":    "#6c7086",
    "INFO":     "#cdd6f4",
    "WARNING":  "#fab387",
    "ERROR":    "#f38ba8",
    "CRITICAL": "#f38ba8",
}


class _QtLogHandler(QObject, logging.Handler):
    """Logging handler that emits a Qt signal for each record."""
    record_emitted = pyqtSignal(str, str)   # (level_name, formatted_message)

    def __init__(self):
        QObject.__init__(self)
        logging.Handler.__init__(self)
        fmt = logging.Formatter(
            "%(asctime)s  %(levelname)-7s  %(name)-30s  %(message)s",
            datefmt="%H:%M:%S",
        )
        self.setFormatter(fmt)

    def emit(self, record: logging.LogRecord) -> None:
        try:
            msg = self.format(record)
            self.record_emitted.emit(record.levelname, msg)
        except Exception:
            pass   # never let logging errors crash the app


class LogPanel(QWidget):
    """Bottom-of-window log viewer."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self._max_lines = 5000

        layout = QVBoxLayout(self)
        layout.setContentsMargins(4, 2, 4, 4)
        layout.setSpacing(2)

        # Header bar with controls
        bar = QHBoxLayout()
        hdr = QLabel("Log")
        hdr.setFont(QFont("Sans", 9, QFont.Weight.Bold))
        bar.addWidget(hdr)
        bar.addSpacing(20)

        bar.addWidget(QLabel("Level:"))
        self._level_cb = QComboBox()
        self._level_cb.addItems(["DEBUG", "INFO", "WARNING", "ERROR"])
        self._level_cb.setCurrentText("INFO")
        self._level_cb.currentTextChanged.connect(self._on_level_change)
        bar.addWidget(self._level_cb)
        bar.addStretch()

        self._btn_clear = QPushButton("Clear")
        self._btn_clear.clicked.connect(self._on_clear)
        bar.addWidget(self._btn_clear)

        self._btn_save = QPushButton("Save…")
        self._btn_save.clicked.connect(self._on_save)
        bar.addWidget(self._btn_save)

        self._btn_copy = QPushButton("Copy all")
        self._btn_copy.clicked.connect(self._on_copy)
        bar.addWidget(self._btn_copy)

        layout.addLayout(bar)

        # Text area
        self._text = QPlainTextEdit()
        self._text.setReadOnly(True)
        self._text.setMaximumBlockCount(self._max_lines)
        self._text.setFont(QFont("Consolas", 9))
        self._text.setStyleSheet(
            "background: #11111b; color: #cdd6f4; "
            "border: 1px solid #313244; padding: 4px;"
        )
        layout.addWidget(self._text, 1)

        # Install handler on root logger
        self._handler = _QtLogHandler()
        self._handler.record_emitted.connect(self._on_record)
        self._handler.setLevel(logging.INFO)
        logging.getLogger().addHandler(self._handler)

    # ------------------------------------------------------------------ slots

    def _on_record(self, level: str, msg: str) -> None:
        cursor = self._text.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.End)
        fmt = QTextCharFormat()
        fmt.setForeground(QColor(_LEVEL_COLORS.get(level, "#cdd6f4")))
        cursor.insertText(msg + "\n", fmt)
        # auto-scroll to bottom
        scrollbar = self._text.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())

    def _on_level_change(self, level: str) -> None:
        self._handler.setLevel(getattr(logging, level, logging.INFO))

    def _on_clear(self) -> None:
        self._text.clear()

    def _on_save(self) -> None:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        suggested = str(Path.home() / f"sdaa_log_{ts}.txt")
        path, _ = QFileDialog.getSaveFileName(
            self, "Save Log", suggested, "Text files (*.txt)"
        )
        if path:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(self._text.toPlainText())

    def _on_copy(self) -> None:
        from PyQt6.QtWidgets import QApplication
        QApplication.clipboard().setText(self._text.toPlainText())

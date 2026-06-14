"""
gui/widgets/compass_widget.py
==============================
Simple compass widget showing polar alignment error vector.
(Placeholder – full SVG rendering in Phase 2)
"""
from PyQt6.QtWidgets import QLabel

class CompassWidget(QLabel):
    """Placeholder compass widget.  Shows text for now."""
    def __init__(self, parent=None):
        super().__init__("Compass (Phase 2)", parent)

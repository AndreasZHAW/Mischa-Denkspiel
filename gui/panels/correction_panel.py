"""
gui/panels/correction_panel.py
================================
Displays human-readable mount correction instructions, including
EQ-mount-specific screw-turn guidance.
"""
from __future__ import annotations
from typing import Optional
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import QFrame, QLabel, QVBoxLayout, QWidget
from core.polar_alignment_solver import PolarError


def _fmt_turns(turns: float) -> str:
    """Format a turn count nicely (e.g. 0.34 → '1/3 turn', 1.25 → '1¼ turns')."""
    n = abs(turns)
    if n < 0.05:
        return "—"
    # Closest pretty fraction within 0.07
    fractions = [
        (0.125, "1/8"), (0.25, "1/4"), (0.333, "1/3"),
        (0.5, "1/2"), (0.667, "2/3"), (0.75, "3/4"),
    ]
    whole = int(n)
    frac_part = n - whole
    pretty_frac = ""
    for v, s in fractions:
        if abs(frac_part - v) < 0.06:
            pretty_frac = s
            break
    if whole == 0:
        return f"{pretty_frac or f'{n:.2f}'} turn"
    if pretty_frac:
        return f"{whole} {pretty_frac} turns"
    return f"{n:.2f} turns"


def _fmt_angle(arcmin: float) -> str:
    """Format an angle (in arcminutes) for human readability:

    - >= 60 arcmin  → "D° MM' SS\""   (degrees, arcminutes, arcseconds)
    -  < 60 arcmin  → "M' SS\""       (arcminutes, arcseconds)
    -  < 1 arcmin   → "SS\""          (arcseconds only)

    Always returns absolute magnitude — the caller is expected to supply
    the direction text ("East", "Up", …) separately.
    """
    a = abs(float(arcmin))
    if a < 1.0:
        s = a * 60.0
        return f'{s:.1f}″'
    if a < 60.0:
        m = int(a)
        s = (a - m) * 60.0
        return f"{m}′ {s:04.1f}″"
    d = int(a / 60.0)
    rem = a - d * 60.0
    m = int(rem)
    s = (rem - m) * 60.0
    return f"{d}° {m:02d}′ {s:04.1f}″"


class CorrectionPanel(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 6, 10, 6)
        layout.setSpacing(4)

        hdr = QLabel("Polar Alignment & Correction")
        hdr.setFont(QFont("Sans", 10, QFont.Weight.Bold))
        layout.addWidget(hdr)

        # ===== Big-number error display =====
        from PyQt6.QtWidgets import QGridLayout
        grid = QGridLayout()
        grid.setHorizontalSpacing(20)
        grid.setVerticalSpacing(2)

        lbl_az   = QLabel("Azimuth")
        lbl_alt  = QLabel("Altitude")
        lbl_tot  = QLabel("Total")
        for l in (lbl_az, lbl_alt, lbl_tot):
            l.setFont(QFont("Sans", 9))
            l.setStyleSheet("color: #94a3b8;")

        self._val_az  = QLabel("–")
        self._val_alt = QLabel("–")
        self._val_tot = QLabel("–")
        for l in (self._val_az, self._val_alt, self._val_tot):
            l.setFont(QFont("Sans", 13, QFont.Weight.Bold))
            l.setStyleSheet("color: #f38ba8;")
            l.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)

        grid.addWidget(lbl_az,        0, 0)
        grid.addWidget(self._val_az,  0, 1)
        grid.addWidget(lbl_alt,       1, 0)
        grid.addWidget(self._val_alt, 1, 1)
        grid.addWidget(lbl_tot,       2, 0)
        grid.addWidget(self._val_tot, 2, 1)
        layout.addLayout(grid)

        self._uncertainty = QLabel("")
        self._uncertainty.setFont(QFont("Monospace", 8))
        self._uncertainty.setStyleSheet("color: #94a3b8;")
        layout.addWidget(self._uncertainty)

        # Divider
        line = QFrame()
        line.setFrameShape(QFrame.Shape.HLine)
        line.setFrameShadow(QFrame.Shadow.Sunken)
        layout.addWidget(line)

        # ===== Screw-turn instructions =====
        screw_hdr = QLabel("Screw adjustments (EQ6-R)")
        screw_hdr.setFont(QFont("Sans", 9, QFont.Weight.Bold))
        layout.addWidget(screw_hdr)

        self._screw_az  = QLabel("  Az  screw:  –")
        self._screw_alt = QLabel("  Alt screw:  –")
        for lbl in (self._screw_az, self._screw_alt):
            lbl.setFont(QFont("Monospace", 10, QFont.Weight.Bold))
            lbl.setStyleSheet("color: #f9e2af;")
            lbl.setWordWrap(True)
            layout.addWidget(lbl)

        self._status_msg = QLabel("(waiting for data…)")
        self._status_msg.setFont(QFont("Monospace", 8))
        self._status_msg.setStyleSheet("color: #94a3b8;")
        self._status_msg.setWordWrap(True)
        layout.addWidget(self._status_msg)

        # Divider before rotation block
        line2 = QFrame()
        line2.setFrameShape(QFrame.Shape.HLine)
        line2.setFrameShadow(QFrame.Shadow.Sunken)
        layout.addWidget(line2)

        rot_hdr = QLabel("Camera rotation")
        rot_hdr.setFont(QFont("Sans", 9, QFont.Weight.Bold))
        layout.addWidget(rot_hdr)

        self._rotation_label = QLabel("  Not yet calibrated")
        self._rotation_label.setFont(QFont("Monospace", 10))
        self._rotation_label.setStyleSheet("color: #94a3b8;")
        self._rotation_label.setWordWrap(True)
        layout.addWidget(self._rotation_label)

        layout.addStretch()

    def update_rotation(
        self,
        rotation_deg: Optional[float],
        source: str = "config",
        correlation: Optional[float] = None,
    ) -> None:
        """Update the camera-rotation display.

        Args:
            rotation_deg: angle in degrees, or None to clear.
            source: where the value came from -- "config", "SDO", "testdata"
            correlation: confidence indicator (0..1) when from SDO
        """
        if rotation_deg is None:
            self._rotation_label.setText("  Not yet calibrated")
            self._rotation_label.setStyleSheet("color: #94a3b8;")
            return

        txt = f"  {rotation_deg:+.1f}°  (source: {source}"
        if correlation is not None:
            txt += f", corr={correlation:.2f}"
        txt += ")"
        # Colour by confidence
        if source == "SDO" and correlation is not None and correlation < 0.20:
            colour = "#fab387"  # low confidence
        else:
            colour = "#a6e3a1"  # known/confirmed
        self._rotation_label.setText(txt)
        self._rotation_label.setStyleSheet(f"color: {colour};")

    def clear(self) -> None:
        """Reset all displayed values to placeholder '–'."""
        from core.polar_alignment_solver import PolarError
        self.update_correction(PolarError())

    def update_correction(self, err: PolarError) -> None:
        if not err.solution_valid:
            self._val_az.setText("–")
            self._val_alt.setText("–")
            self._val_tot.setText("–")
            self._uncertainty.setText("")
            self._screw_az.setText("  Az  screw:  –")
            self._screw_alt.setText("  Alt screw:  –")
            self._status_msg.setText(err.message or "(waiting for data…)")
            return

        # Direction labels
        az_dir  = "East" if err.azimuth_arcmin  > 0 else "West"
        alt_dir = "Down" if err.altitude_arcmin > 0 else "Up"
        self._val_az.setText(f"{_fmt_angle(err.azimuth_arcmin)} {az_dir}")
        self._val_alt.setText(f"{_fmt_angle(err.altitude_arcmin)} {alt_dir}")
        self._val_tot.setText(_fmt_angle(err.total_arcmin))
        self._uncertainty.setText(
            f"Uncertainty:  ±{_fmt_angle(err.sigma_az_arcmin)} Az   "
            f"±{_fmt_angle(err.sigma_alt_arcmin)} Alt"
        )

        # Screw block
        if abs(err.az_screw_turns) >= 0.05:
            self._screw_az.setText(
                f"  Az  screw:  tighten {err.az_screw_side.upper()}  "
                f"{_fmt_turns(err.az_screw_turns)}"
            )
        else:
            self._screw_az.setText("  Az  screw:  no adjustment needed")

        if abs(err.alt_screw_turns) >= 0.05:
            verb = "tighten" if err.alt_screw_side == "up" else "loosen"
            self._screw_alt.setText(
                f"  Alt screw:  {verb} ({err.alt_screw_side.upper()})  "
                f"{_fmt_turns(err.alt_screw_turns)}"
            )
        else:
            self._screw_alt.setText("  Alt screw:  no adjustment needed")

        self._status_msg.setText("")

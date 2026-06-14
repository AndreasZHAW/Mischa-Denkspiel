"""
gui/panels/drift_plot_panel.py
================================
Drift visualisation with two tabs:

  Tab 1: Position over time  (raw data)
         - Scatter plot of cx(t), cy(t) (or RA(t), Dec(t))
         - Point size and colour reflect detection quality
         - Weighted linear fit drawn as solid line
         - Outliers shown in red

  Tab 2: Drift rate over time
         - The progressive drift-rate estimate as the solver sees more data
         - Useful for "is the answer converging?"
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

import numpy as np
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (
    QLabel, QTabWidget, QVBoxLayout, QWidget,
)

try:
    import pyqtgraph as pg
    HAS_PG = True
except ImportError:
    HAS_PG = False

from core.tracking_engine import TrackPoint, PointStatus
from core.drift_solver import DriftSolution


if HAS_PG:
    class _TimeAxisItem(pg.AxisItem):
        """X-axis that formats elapsed minutes as mm:ss."""
        def tickStrings(self, values, scale, spacing):
            out = []
            for v in values:
                total_sec = int(round(float(v) * 60.0))
                m, s = divmod(total_sec, 60)
                # Show hours if we ever get that long
                if m >= 60:
                    h, m = divmod(m, 60)
                    out.append(f"{h}:{m:02d}:{s:02d}")
                else:
                    out.append(f"{m}:{s:02d}")
            return out
else:
    _TimeAxisItem = None


class DriftPlotPanel(QWidget):
    """Two-tab drift visualisation."""

    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(4, 4, 4, 4)
        layout.setSpacing(2)

        hdr = QLabel("Drift Analysis")
        hdr.setFont(QFont("Sans", 9, QFont.Weight.Bold))
        layout.addWidget(hdr)

        if not HAS_PG:
            layout.addWidget(QLabel(
                "pyqtgraph not installed. Install with: pip install pyqtgraph"
            ))
            return

        pg.setConfigOption("background", "#1e1e2e")
        pg.setConfigOption("foreground", "#cdd6f4")
        pg.setConfigOptions(antialias=True)

        self._tabs = QTabWidget()
        layout.addWidget(self._tabs)

        # --- Tab 1: Position over time ---
        self._tab_pos = self._build_position_tab()
        self._tabs.addTab(self._tab_pos, "Position vs Time")

        # --- Tab 2: Drift Rate over time ---
        self._tab_rate = self._build_rate_tab()
        self._tabs.addTab(self._tab_rate, "Rate Convergence")

        # Drift rate history (one value per solve call)
        self._ra_rate_hist:  list[float] = []
        self._dec_rate_hist: list[float] = []
        # Sunspot phase-correlation track: lists of (t_min, dx_arcsec, dy_arcsec)
        self._sunspot_t:  list[float] = []
        self._sunspot_dx: list[float] = []
        self._sunspot_dy: list[float] = []
        self._sunspot_err: list[float] = []   # arcsec, 1σ from phase-corr response
        self._sunspot_ref_cx: Optional[float] = None
        self._sunspot_ref_cy: Optional[float] = None
        # Reference timestamp for X axis (set when first point arrives)
        self._t0: Optional[datetime] = None

    # ------------------------------------------------------------------ build

    def _build_position_tab(self) -> QWidget:
        w = QWidget()
        layout = QVBoxLayout(w)
        layout.setContentsMargins(2, 2, 2, 2)
        layout.setSpacing(2)

        # Compact inline legend
        legend = QLabel(
            "  <span style='color:#89b4fa'>●</span> Limb fit"
            "    <span style='color:#fab387'>○</span> Sunspot correlation (independent)"
            "    <span style='color:#f38ba8'>✕</span> Outlier"
            "    │ dashed = weighted linear fit"
            "    │ bars = ±2σ (≈ 95 % coverage)"
        )
        legend.setTextFormat(Qt.TextFormat.RichText)
        legend.setStyleSheet("font-size: 9pt;")
        layout.addWidget(legend)

        # Use a single GraphicsLayoutWidget so the two subplots share the X axis
        glw = pg.GraphicsLayoutWidget()
        glw.setBackground("#1e1e2e")

        # === Top subplot: ΔX (RA-ish) ===
        self._plot_dx = glw.addPlot(
            row=0, col=0,
            axisItems={"bottom": _TimeAxisItem(orientation="bottom")},
        )
        self._plot_dx.setLabel("left",   "ΔX  (arcsec, RA-ish)", color="#89b4fa")
        self._plot_dx.showGrid(x=True, y=True, alpha=0.3)
        self._plot_dx.getAxis("bottom").setStyle(showValues=False)

        # === Bottom subplot: ΔY (Dec-ish) ===
        self._plot_dy = glw.addPlot(
            row=1, col=0,
            axisItems={"bottom": _TimeAxisItem(orientation="bottom")},
        )
        self._plot_dy.setLabel("left",   "ΔY  (arcsec, Dec-ish)", color="#a6e3a1")
        self._plot_dy.setLabel("bottom", "Time (mm:ss)")
        self._plot_dy.showGrid(x=True, y=True, alpha=0.3)
        # Tight space between the two subplots
        glw.ci.layout.setSpacing(2)
        glw.ci.layout.setContentsMargins(2, 2, 2, 2)

        # Link X axes so panning/zooming works together
        self._plot_dy.setXLink(self._plot_dx)

        # --- Items for ΔX subplot ---
        self._scatter_x  = pg.ScatterPlotItem(brush=pg.mkBrush(137, 180, 250, 200),
                                              pen=None, size=8)
        self._scatter_bad_x = pg.ScatterPlotItem(brush=pg.mkBrush(243, 139, 168, 150),
                                                 pen=None, size=6, symbol="x")
        self._errbars_x = pg.ErrorBarItem(pen=pg.mkPen("#89b4fa", width=1))
        self._fit_line_x = pg.PlotCurveItem(
            pen=pg.mkPen("#89b4fa", width=2, style=Qt.PenStyle.DashLine)
        )
        self._sunspot_x = pg.ScatterPlotItem(
            brush=None, pen=pg.mkPen("#fab387", width=2),
            symbol="o", size=10,
        )
        self._sunspot_errbars_x = pg.ErrorBarItem(pen=pg.mkPen("#fab387", width=1))
        self._sunspot_fit_x = pg.PlotCurveItem(
            pen=pg.mkPen("#fab387", width=1, style=Qt.PenStyle.DotLine)
        )
        for itm in (self._errbars_x, self._sunspot_errbars_x,
                    self._scatter_x, self._scatter_bad_x,
                    self._sunspot_x, self._sunspot_fit_x, self._fit_line_x):
            self._plot_dx.addItem(itm)

        # --- Items for ΔY subplot ---
        self._scatter_y  = pg.ScatterPlotItem(brush=pg.mkBrush(166, 227, 161, 200),
                                              pen=None, size=8)
        self._scatter_bad_y = pg.ScatterPlotItem(brush=pg.mkBrush(243, 139, 168, 150),
                                                 pen=None, size=6, symbol="x")
        self._errbars_y = pg.ErrorBarItem(pen=pg.mkPen("#a6e3a1", width=1))
        self._fit_line_y = pg.PlotCurveItem(
            pen=pg.mkPen("#a6e3a1", width=2, style=Qt.PenStyle.DashLine)
        )
        self._sunspot_y = pg.ScatterPlotItem(
            brush=None, pen=pg.mkPen("#f9e2af", width=2),
            symbol="o", size=10,
        )
        self._sunspot_errbars_y = pg.ErrorBarItem(pen=pg.mkPen("#f9e2af", width=1))
        self._sunspot_fit_y = pg.PlotCurveItem(
            pen=pg.mkPen("#f9e2af", width=1, style=Qt.PenStyle.DotLine)
        )
        for itm in (self._errbars_y, self._sunspot_errbars_y,
                    self._scatter_y, self._scatter_bad_y,
                    self._sunspot_y, self._sunspot_fit_y, self._fit_line_y):
            self._plot_dy.addItem(itm)

        layout.addWidget(glw)
        return w

    def _build_rate_tab(self) -> QWidget:
        w = QWidget()
        layout = QVBoxLayout(w)
        layout.setContentsMargins(0, 0, 0, 0)

        self._plot_rate = pg.PlotWidget()
        self._plot_rate.setLabel("left",   "Drift rate", units="arcsec/min")
        self._plot_rate.setLabel("bottom", "Sample (update count)")
        self._plot_rate.showGrid(x=True, y=True, alpha=0.3)

        self._curve_ra  = self._plot_rate.plot(pen=pg.mkPen("#89b4fa", width=2))
        self._curve_dec = self._plot_rate.plot(pen=pg.mkPen("#a6e3a1", width=2))

        # Inline labels (no overlay legend that covers data)
        hdr = QLabel(
            "  <span style='color:#89b4fa'>● RA-ish (ΔX rate)</span>"
            "    <span style='color:#a6e3a1'>● Dec-ish (ΔY rate)</span>"
        )
        hdr.setTextFormat(Qt.TextFormat.RichText)
        layout.addWidget(hdr)
        layout.addWidget(self._plot_rate)
        return w

    # ------------------------------------------------------------------ updates

    def update_from_tracking(
        self,
        points: list[TrackPoint],
        plate_scale_arcsec_px: float = 4.31,
    ) -> None:
        """
        Redraw the Position-vs-Time tab from the full set of TrackPoints.
        Called whenever a new frame is processed.

        Error bars use a *realistic* uncertainty:
            σ_i = sqrt( σ_limb² + σ_scatter² )
        where σ_limb is the per-frame limb-fit RMS (sub-pixel) and
        σ_scatter is the rolling standard deviation of the residuals
        from the local linear trend (captures seeing/atmospheric jitter).
        """
        if not HAS_PG or not points:
            return

        ok_pts = [p for p in points if p.status in (PointStatus.OK, PointStatus.LOW_QUALITY)]
        if not ok_pts:
            return

        first_pts = ok_pts[: min(5, len(ok_pts))]
        cx_ref = float(np.median([p.cx_px for p in first_pts]))
        cy_ref = float(np.median([p.cy_px for p in first_pts]))

        if self._t0 is None:
            self._t0 = points[0].timestamp

        # First pass: collect raw OK arrays
        ok_t, ok_dx, ok_dy, ok_w, ok_limb_err = [], [], [], [], []
        bad_t, bad_dx, bad_dy = [], [], []
        for p in points:
            t_min = (p.timestamp - self._t0).total_seconds() / 60.0
            dx_as = (p.cx_px - cx_ref) * plate_scale_arcsec_px
            dy_as = (p.cy_px - cy_ref) * plate_scale_arcsec_px
            if p.status in (PointStatus.OK, PointStatus.LOW_QUALITY):
                ok_t.append(t_min)
                ok_dx.append(dx_as)
                ok_dy.append(dy_as)
                ok_w.append(max(p.quality, 0.05))
                ok_limb_err.append(max(p.rms_px, 0.5) * plate_scale_arcsec_px)
            else:
                bad_t.append(t_min)
                bad_dx.append(dx_as)
                bad_dy.append(dy_as)

        # ---- Realistic error bars ----
        # Three sources of uncertainty:
        #   σ_limb   - per-frame limb-fit precision (sub-pixel typically)
        #   σ_local  - local scatter from neighbours (catches short bursts)
        #   σ_global - overall scatter around the global fit (catches slower
        #              systematic deviations that local fits miss because they
        #              also dip together)
        # We use 2σ → ~95 % of points have their error bar reach the fit line.
        # (1σ gives 68 %; 1.5σ gives 85 %.  User feedback: still too small.)
        SIGMA_MULTIPLIER = 2.0
        sigma_limb = np.asarray(ok_limb_err)
        sigma_local_x = _per_point_scatter(ok_t, ok_dx, window=15)
        sigma_local_y = _per_point_scatter(ok_t, ok_dy, window=15)

        # Compute the eventual weighted-fit residuals and use their robust
        # scatter (median absolute deviation × 1.4826) as σ_global
        if len(ok_t) >= 5:
            t_arr_g = np.asarray(ok_t)
            w_g     = np.asarray(ok_w) ** 2
            mx_g, bx_g = _weighted_linfit(t_arr_g, np.asarray(ok_dx), w_g)
            my_g, by_g = _weighted_linfit(t_arr_g, np.asarray(ok_dy), w_g)
            resid_x = np.asarray(ok_dx) - (mx_g * t_arr_g + bx_g)
            resid_y = np.asarray(ok_dy) - (my_g * t_arr_g + by_g)
            mad_x = float(np.median(np.abs(resid_x - np.median(resid_x))))
            mad_y = float(np.median(np.abs(resid_y - np.median(resid_y))))
            sigma_global_x = max(1.4826 * mad_x, 0.5)
            sigma_global_y = max(1.4826 * mad_y, 0.5)
        else:
            sigma_global_x = sigma_global_y = 1.0

        err_x = SIGMA_MULTIPLIER * np.maximum.reduce([
            sigma_limb, sigma_local_x, np.full(len(ok_t), sigma_global_x),
        ])
        err_y = SIGMA_MULTIPLIER * np.maximum.reduce([
            sigma_limb, sigma_local_y, np.full(len(ok_t), sigma_global_y),
        ])

        # ---- Plot data on the two subplots ----
        sizes = [3 + 11 * w for w in ok_w]
        self._scatter_x.setData(x=ok_t, y=ok_dx, size=sizes)
        self._scatter_y.setData(x=ok_t, y=ok_dy, size=sizes)
        self._scatter_bad_x.setData(x=bad_t, y=bad_dx)
        self._scatter_bad_y.setData(x=bad_t, y=bad_dy)

        if ok_t:
            t_arr = np.asarray(ok_t)
            self._errbars_x.setData(
                x=t_arr, y=np.asarray(ok_dx),
                top=err_x, bottom=err_x, beam=0.05,
            )
            self._errbars_y.setData(
                x=t_arr, y=np.asarray(ok_dy),
                top=err_y, bottom=err_y, beam=0.05,
            )
        else:
            self._errbars_x.setData(x=[], y=[])
            self._errbars_y.setData(x=[], y=[])

        # ---- Weighted linear fit per axis ----
        if len(ok_t) >= 2:
            t  = np.asarray(ok_t)
            w  = np.asarray(ok_w) ** 2          # weight by quality²
            for vals, line in ((ok_dx, self._fit_line_x),
                               (ok_dy, self._fit_line_y)):
                v = np.asarray(vals)
                m, b = _weighted_linfit(t, v, w)
                line.setData(x=[t.min(), t.max()],
                             y=[m * t.min() + b, m * t.max() + b])
        else:
            self._fit_line_x.setData([], [])
            self._fit_line_y.setData([], [])

    def update_solution(self, sol: DriftSolution) -> None:
        """Update the Rate Convergence tab with a new drift estimate."""
        if not HAS_PG or not sol.solution_valid:
            return
        self._ra_rate_hist.append(sol.drift_ra_arcsec_min)
        self._dec_rate_hist.append(sol.drift_dec_arcsec_min)
        xs = list(range(len(self._ra_rate_hist)))
        self._curve_ra.setData(xs,  self._ra_rate_hist)
        self._curve_dec.setData(xs, self._dec_rate_hist)

    def update_sunspot(
        self,
        payload: dict,
        plate_scale_arcsec_px: float = 4.31,
    ) -> None:
        """Append a sunspot-correlation measurement to the position plot.

        Payload keys (from worker.sunspot_updated): frame_idx, timestamp,
        cx_px, cy_px, response, success.

        Error bar derived from phase-correlation response.  Phase correlation
        gives a sub-pixel peak whose position uncertainty roughly scales as
        ~1/response.  Response 1.0 ≈ perfect match (σ ≈ 0.1 px); response
        0.3 ≈ marginal (σ ≈ 1 px).
        """
        if not HAS_PG or not payload.get("success"):
            return
        if self._t0 is None:
            self._t0 = payload["timestamp"]
        if self._sunspot_ref_cx is None:
            # First sunspot point: set as reference, AND plot it at (0, 0)
            # so the curve starts at the same place as the limb-fit curve.
            self._sunspot_ref_cx = payload["cx_px"]
            self._sunspot_ref_cy = payload["cy_px"]
            self._sunspot_t.append(0.0)
            self._sunspot_dx.append(0.0)
            self._sunspot_dy.append(0.0)
            self._sunspot_err.append(0.5 * plate_scale_arcsec_px)
            self._sunspot_x.setData(x=self._sunspot_t, y=self._sunspot_dx)
            self._sunspot_y.setData(x=self._sunspot_t, y=self._sunspot_dy)
            return

        t_min = (payload["timestamp"] - self._t0).total_seconds() / 60.0
        dx_as = (payload["cx_px"] - self._sunspot_ref_cx) * plate_scale_arcsec_px
        dy_as = (payload["cy_px"] - self._sunspot_ref_cy) * plate_scale_arcsec_px

        # Uncertainty: combine the per-point correlation uncertainty with the
        # local scatter among recent sunspot measurements.  The max of the two
        # is reported so that noisy patches give visible bars.
        response = max(float(payload.get("response", 0.5)), 0.05)
        # σ_corr: higher response = better match = smaller uncertainty
        sigma_corr_px = min(0.5 / response, 10.0)
        sigma_corr_as = sigma_corr_px * plate_scale_arcsec_px

        self._sunspot_t.append(t_min)
        self._sunspot_dx.append(dx_as)
        self._sunspot_dy.append(dy_as)

        t_arr = np.asarray(self._sunspot_t)
        dx_arr = np.asarray(self._sunspot_dx)
        dy_arr = np.asarray(self._sunspot_dy)
        n = len(t_arr)

        # ---- Fit line through sunspot track ----
        if n >= 3:
            mx, bx = np.polyfit(t_arr, dx_arr, 1)
            my, by = np.polyfit(t_arr, dy_arr, 1)
            t_fit = np.array([t_arr[0], t_arr[-1]])
            self._sunspot_fit_x.setData(t_fit, mx * t_fit + bx)
            self._sunspot_fit_y.setData(t_fit, my * t_fit + by)
            resid_x = dx_arr - (mx * t_arr + bx)
            resid_y = dy_arr - (my * t_arr + by)
            # Global scatter (MAD-based, robust)
            mad_x = float(np.median(np.abs(resid_x - np.median(resid_x))))
            mad_y = float(np.median(np.abs(resid_y - np.median(resid_y))))
            sigma_global_x = max(1.4826 * mad_x, 1.0)
            sigma_global_y = max(1.4826 * mad_y, 1.0)
        else:
            sigma_global_x = sigma_global_y = 1.0

        # Per-point local scatter
        sigma_local_x = _per_point_scatter(self._sunspot_t, self._sunspot_dx, window=15)
        sigma_local_y = _per_point_scatter(self._sunspot_t, self._sunspot_dy, window=15)

        # Combine: take max of local scatter and global MAD, scale to 2σ
        err_x = np.maximum(sigma_local_x, sigma_global_x) * 2.0
        err_y = np.maximum(sigma_local_y, sigma_global_y) * 2.0
        self._sunspot_err.append(float(err_x[-1]))

        self._sunspot_x.setData(x=t_arr, y=dx_arr)
        self._sunspot_y.setData(x=t_arr, y=dy_arr)
        self._sunspot_errbars_x.setData(x=t_arr, y=dx_arr, top=err_x, bottom=err_x, beam=0.04)
        self._sunspot_errbars_y.setData(x=t_arr, y=dy_arr, top=err_y, bottom=err_y, beam=0.04)

    def clear(self) -> None:
        if not HAS_PG:
            return
        self._ra_rate_hist.clear()
        self._dec_rate_hist.clear()
        self._sunspot_t.clear()
        self._sunspot_dx.clear()
        self._sunspot_dy.clear()
        self._sunspot_err.clear()
        self._sunspot_ref_cx = None
        self._sunspot_ref_cy = None
        self._curve_ra.setData([], [])
        self._curve_dec.setData([], [])
        self._scatter_x.setData([], [])
        self._scatter_y.setData([], [])
        self._scatter_bad_x.setData([], [])
        self._scatter_bad_y.setData([], [])
        self._sunspot_x.setData([], [])
        self._sunspot_y.setData([], [])
        self._sunspot_errbars_x.setData(x=[], y=[])
        self._sunspot_errbars_y.setData(x=[], y=[])
        self._sunspot_fit_x.setData([], [])
        self._sunspot_fit_y.setData([], [])
        self._fit_line_x.setData([], [])
        self._fit_line_y.setData([], [])
        self._errbars_x.setData(x=[], y=[])
        self._errbars_y.setData(x=[], y=[])
        self._t0 = None


def _weighted_linfit(t: np.ndarray, v: np.ndarray, w: np.ndarray):
    """Same as drift_solver, kept local for plot independence."""
    S   = w.sum()
    St  = (w * t).sum()
    Sv  = (w * v).sum()
    Stt = (w * t * t).sum()
    Stv = (w * t * v).sum()
    det = S * Stt - St ** 2
    if abs(det) < 1e-12:
        return 0.0, float(v.mean())
    m = (S * Stv - St * Sv) / det
    b = (Stt * Sv - St * Stv) / det
    return float(m), float(b)


def _per_point_scatter(
    t_list: list, v_list: list, window: int = 15,
) -> np.ndarray:
    """Per-point uncertainty estimate from local trend scatter.

    For each point i we fit a linear trend to its ``window``-sized
    neighbourhood and take the RMS of the residuals as the σ for that point.
    This captures atmospheric jitter and any short-term wobble that the
    limb-fit RMS doesn't see.

    Returns σ array (arcsec) of the same length as the inputs.
    """
    n = len(t_list)
    if n < 3:
        return np.full(n, 1.0)   # minimal default

    t = np.asarray(t_list)
    v = np.asarray(v_list)
    sigma = np.zeros(n)
    half = max(window // 2, 3)
    for i in range(n):
        lo = max(0, i - half)
        hi = min(n, i + half + 1)
        if hi - lo < 3:
            sigma[i] = 1.0
            continue
        tt, vv = t[lo:hi], v[lo:hi]
        # Linear fit to neighbourhood; RMS of residuals = local scatter
        m, b = np.polyfit(tt, vv, 1)
        resid = vv - (m * tt + b)
        # Bessel-corrected sample std; floor at 0.5 arcsec so error bars
        # never collapse to invisibility
        sigma[i] = max(float(np.std(resid, ddof=1)), 0.5)
    return sigma

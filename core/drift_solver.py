"""
core/drift_solver.py
=====================
Computes the drift rate of the solar disk from a time-series of positions.

Method:
  Weighted linear regression  x(t) = m_x * t + b_x
                               y(t) = m_y * t + b_y

  Weight of each point = quality^2  (quality from detection step)

Outputs (all in arcsec / min):
  drift_ra   – drift in the RA direction (East/West in sky)
  drift_dec  – drift in the Dec direction (North/South in sky)
  uncertainty estimates for each rate

Pixel → arcsec conversion uses the plate scale from config.
RA/Dec decomposition uses the camera rotation angle θ from calibration.

    drift_ra  =  drift_x * cos(θ) + drift_y * sin(θ)
    drift_dec = -drift_x * sin(θ) + drift_y * cos(θ)

Note: image y-axis points *downward*, so positive pixel-y = southward drift
      when camera is not rotated (θ=0).  Sign conventions follow:
      +RA  = East,  +Dec = North.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import numpy as np

from config.config_manager import DriftConfig
from core.tracking_engine import TrackPoint

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class DriftSolution:
    """
    Output of the drift solver.

    All rates are in arcsec/min.
    Positive drift_dec = northward drift.
    Positive drift_ra  = eastward drift.
    """
    # Pixel-space rates
    drift_x_px_min:    float = 0.0   # pixels / minute
    drift_y_px_min:    float = 0.0

    # Sky-space rates (after rotation + plate scale)
    drift_ra_arcsec_min:  float = 0.0
    drift_dec_arcsec_min: float = 0.0

    # Uncertainty (1-sigma)
    sigma_ra_arcsec_min:  float = 0.0
    sigma_dec_arcsec_min: float = 0.0

    # Fit diagnostics
    n_points:        int   = 0
    n_outliers:      int   = 0
    r_squared_x:     float = 0.0   # goodness-of-fit for X
    r_squared_y:     float = 0.0
    solution_valid:  bool  = False  # False until min_frames reached
    message:         str   = ""


# ---------------------------------------------------------------------------
# Solver
# ---------------------------------------------------------------------------

class DriftSolver:
    """
    Stateless solver: call ``solve()`` with the current list of TrackPoints
    and receive a ``DriftSolution``.

    Args:
        cfg:              Drift config (min frames, outlier sigma, …)
        plate_scale:      arcsec per pixel
        camera_rotation:  angle from pixel-X to celestial-East (degrees, CCW positive)
    """

    def __init__(
        self,
        cfg: DriftConfig,
        plate_scale_arcsec_px: float,
        camera_rotation_deg:   float = 0.0,
    ) -> None:
        self._cfg      = cfg
        self._ps       = plate_scale_arcsec_px
        self._theta    = np.radians(camera_rotation_deg)

    # ------------------------------------------------------------------ public

    def solve(self, points: list[TrackPoint]) -> DriftSolution:
        """
        Compute drift from a list of active TrackPoints.
        Quiet points below min_frames return ``solution_valid=False``.
        """
        sol = DriftSolution()

        if len(points) < self._cfg.min_frames_for_solution:
            sol.message = (
                f"Waiting for data  ({len(points)}/{self._cfg.min_frames_for_solution} frames)"
            )
            return sol

        # Convert to arrays
        ref_time = points[0].timestamp
        t = np.array([(p.timestamp - ref_time).total_seconds() / 60.0
                      for p in points])   # minutes
        x = np.array([p.cx_px for p in points])
        y = np.array([p.cy_px for p in points])
        w = np.array([p.quality ** 2 for p in points])
        w = np.clip(w, 1e-6, 1.0)

        # Weighted linear regression
        mx, bx, sx = _weighted_linreg(t, x, w)
        my, by, sy = _weighted_linreg(t, y, w)

        # Pixel/min → arcsec/min
        dx_arcsec = mx * self._ps   # arcsec/min along pixel-X
        dy_arcsec = my * self._ps   # arcsec/min along pixel-Y (down = south)

        # Rotate into RA/Dec frame
        # Note: pixel-Y points down, so we flip sign for Dec (north positive)
        theta = self._theta
        drift_ra  = dx_arcsec * np.cos(theta) + dy_arcsec * np.sin(theta)
        drift_dec = -(- dx_arcsec * np.sin(theta) + dy_arcsec * np.cos(theta))
        # Dec: invert y because +pixel_y = southward → -Dec

        sigma_ra  = sx * self._ps
        sigma_dec = sy * self._ps

        # Sanity check
        total_drift = np.sqrt(drift_ra ** 2 + drift_dec ** 2)
        if total_drift > self._cfg.max_drift_arcsec_min:
            sol.message = (
                f"⚠ Drift {total_drift:.0f} arcsec/min exceeds sanity limit "
                f"({self._cfg.max_drift_arcsec_min:.0f}) – check tracking rate."
            )
            sol.solution_valid = False
            return sol

        sol.drift_x_px_min       = float(mx)
        sol.drift_y_px_min       = float(my)
        sol.drift_ra_arcsec_min  = float(drift_ra)
        sol.drift_dec_arcsec_min = float(drift_dec)
        sol.sigma_ra_arcsec_min  = float(sigma_ra)
        sol.sigma_dec_arcsec_min = float(sigma_dec)
        sol.n_points             = len(points)
        sol.r_squared_x          = float(_r_squared(t, x, mx, bx, w))
        sol.r_squared_y          = float(_r_squared(t, y, my, by, w))
        sol.solution_valid       = True
        sol.message              = (
            f"RA {drift_ra:+.1f}  Dec {drift_dec:+.1f} arcsec/min  "
            f"(n={len(points)}  R²x={sol.r_squared_x:.3f})"
        )
        return sol

    def predicted_position(
        self,
        points: list[TrackPoint],
        t_minutes_ahead: float = 0.0,
    ) -> Optional[tuple[float, float]]:
        """
        Extrapolate the solar position t_minutes_ahead into the future.
        Returns (cx, cy) in pixels, or None if no valid solution.
        """
        if len(points) < self._cfg.min_frames_for_solution:
            return None
        ref = points[0].timestamp
        t = np.array([(p.timestamp - ref).total_seconds() / 60.0 for p in points])
        x = np.array([p.cx_px for p in points])
        y = np.array([p.cy_px for p in points])
        w = np.array([p.quality ** 2 for p in points])
        mx, bx, _ = _weighted_linreg(t, x, w)
        my, by, _ = _weighted_linreg(t, y, w)
        t_pred = t[-1] + t_minutes_ahead
        return float(mx * t_pred + bx), float(my * t_pred + by)


# ---------------------------------------------------------------------------
# Math helpers
# ---------------------------------------------------------------------------

def _weighted_linreg(
    t: np.ndarray,
    v: np.ndarray,
    w: np.ndarray,
) -> tuple[float, float, float]:
    """
    Weighted least-squares fit  v = m*t + b.
    Returns (m, b, sigma_m).
    """
    S   = w.sum()
    St  = (w * t).sum()
    Sv  = (w * v).sum()
    Stt = (w * t * t).sum()
    Stv = (w * t * v).sum()

    det = S * Stt - St ** 2
    if abs(det) < 1e-12:
        return 0.0, v.mean(), np.inf

    m = (S * Stv - St * Sv) / det
    b = (Stt * Sv - St * Stv) / det

    # Uncertainty in slope
    residuals = v - (m * t + b)
    n = len(t)
    if n > 2:
        var_resid = (w * residuals ** 2).sum() / (n - 2) / (w.mean())
        sigma_m   = float(np.sqrt(var_resid * S / det))
    else:
        sigma_m = np.inf

    return float(m), float(b), sigma_m


def _r_squared(
    t: np.ndarray,
    v: np.ndarray,
    m: float,
    b: float,
    w: np.ndarray,
) -> float:
    v_pred = m * t + b
    ss_res = (w * (v - v_pred) ** 2).sum()
    v_mean = (w * v).sum() / w.sum()
    ss_tot = (w * (v - v_mean) ** 2).sum()
    return float(1.0 - ss_res / ss_tot) if ss_tot > 1e-12 else 1.0

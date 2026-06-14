"""
core/polar_alignment_solver.py
================================
Converts measured drift rates (arcsec/min) into polar alignment errors
(azimuth and altitude offset of the mount's polar axis).

Physical basis – drift alignment method:
  When the polar axis is misaligned by (Δaz, Δalt) in azimuth and altitude,
  the tracking error manifests as drift in RA and Dec:

    dδ/dt  ≈ -Δaz · 15·cos(φ)·cos(H)  +  Δalt · 15·sin(H)        [arcsec/s]
    dα/dt  ≈  Δaz · 15·(cos(φ)·sin(H)·sin(δ) − sin(φ)·cos(δ)) / cos(δ)
             − Δalt · 15·cos(H)·sin(δ) / cos(δ)                    [arcsec/s]

  where  φ = observer latitude
          H = hour angle of target (degrees, west positive)
          δ = declination of target (degrees)

  We solve the 2×2 linear system for each epoch using the current sun
  position (H, δ computed from time + observer location via astropy).

Correction instructions:
  Azimuth error:
    + East  → rotate polar axis CW when viewed from above (North end East)
    - West  → rotate polar axis CCW when viewed from above (North end West)
  Altitude error:
    + Up    → tilt polar axis up (increase altitude)
    - Down  → tilt polar axis down (decrease altitude)

References:
  Berry & Burnell "Handbook of Astronomical Image Processing" 2nd ed., ch. 5.
  Tully (2006) "Drift Alignment by Trial and Error".
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

import numpy as np

from config.config_manager import ObserverConfig
from core.drift_solver import DriftSolution

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class PolarError:
    """
    Polar alignment error output.

    All angular errors in arcminutes.
    Sign convention:
      azimuth_arcmin  > 0 → polar axis too far East  (correct: move West)
      azimuth_arcmin  < 0 → polar axis too far West  (correct: move East)
      altitude_arcmin > 0 → polar axis too high      (correct: tilt down)
      altitude_arcmin < 0 → polar axis too low       (correct: tilt up)
    """
    azimuth_arcmin:  float = 0.0
    altitude_arcmin: float = 0.0
    total_arcmin:    float = 0.0   # magnitude of total error vector
    az_direction:    str   = "–"   # "East" | "West" | "–"
    alt_direction:   str   = "–"   # "Up"   | "Down" | "–"
    solution_valid:  bool  = False
    # Uncertainty (1-sigma)
    sigma_az_arcmin:  float = 0.0
    sigma_alt_arcmin: float = 0.0
    # Context used for computation
    hour_angle_deg:   float = 0.0
    sun_dec_deg:      float = 0.0
    # Human-readable correction text
    correction_az:  str = ""
    correction_alt: str = ""
    # Screw-turn instructions (filled in by attach_screw_instructions())
    az_screw_turns:   float = 0.0   # signed: positive = right (CW), negative = left (CCW)
    alt_screw_turns:  float = 0.0   # signed: positive = up, negative = down
    az_screw_side:    str = "–"     # "right" | "left" | "–"
    alt_screw_side:   str = "–"     # "up" | "down" | "–"
    message:        str = ""


# ---------------------------------------------------------------------------
# Solver
# ---------------------------------------------------------------------------

class PolarAlignmentSolver:
    """
    Converts a ``DriftSolution`` into a ``PolarError``.

    Requires the current solar position (computed from time + observer location).
    """

    def __init__(self, observer: ObserverConfig) -> None:
        self._obs = observer
        self._last_good: Optional[PolarError] = None
        self._last_good_det: float = 0.0

    def reset_cache(self) -> None:
        """Clear cached good solution so the next solve starts fresh."""
        self._last_good = None
        self._last_good_det = 0.0

    # ------------------------------------------------------------------ public

    def solve(
        self,
        drift:     DriftSolution,
        obs_time:  Optional[datetime] = None,
    ) -> PolarError:
        """
        Compute polar alignment error.

        Args:
            drift:    Result from DriftSolver.
            obs_time: Observation time (UTC).  Uses current time if None.
        """
        err = PolarError()

        if not drift.solution_valid:
            err.message = "No valid drift solution yet."
            return err

        if obs_time is None:
            obs_time = datetime.now(tz=timezone.utc)

        # Get sun's RA/Dec and hour angle
        try:
            sun_ra, sun_dec, hour_angle = self._sun_position(obs_time)
        except Exception as e:
            err.message = f"Could not compute sun position: {e}"
            return err

        phi  = math.radians(self._obs.latitude_deg)
        H    = math.radians(hour_angle)
        delta = math.radians(sun_dec)

        cos_phi = math.cos(phi)
        cos_H   = math.cos(H)
        sin_H   = math.sin(H)
        cos_dec = math.cos(delta)
        sin_dec = math.sin(delta)

        # Convert arcsec/min → arcsec/sec
        d_dec = drift.drift_dec_arcsec_min / 60.0  # arcsec/s
        d_ra  = drift.drift_ra_arcsec_min  / 60.0  # arcsec/s (actual sky RA rate)

        # RA tracking already removes sidereal (or solar) motion.
        # Any residual d_ra is pure mount error.

        # Coefficient matrix [2×2]:
        #   [d_dec]   [A  B] [Δaz ]
        #   [d_ra ]  = [C  D] [Δalt]
        #
        # ------------- Tully / King drift formulas (CORRECTED) -------------
        # Reference: Tully (1972), Berry (1990), and the standard "drift method"
        # equations.  Earlier versions of this file had sin(H) and cos(H)
        # systematically swapped in A and B (the alt coefficient), producing
        # answers that were factor-of-15 too large AND a spurious singularity
        # at HA ≈ ±17°.  The correct equations are:
        #
        #   d(δ)/dt = ω · ( -Δaz · cos(φ)·sin(H) + Δalt · cos(H) )
        #   d(α)/dt·cos(δ) = ω · ( Δaz·(cos(φ)·cos(H)·sin(δ) − sin(φ)·cos(δ))
        #                          + Δalt · sin(H)·sin(δ) ) / cos(δ)
        #
        # Verification: at H = 0 (sun on meridian), Δalt produces maximum dec
        # drift (=ω·Δalt) — which is exactly how the "drift method" detects
        # altitude error.  Δaz at H=0 produces no dec drift (sin(0)=0), again
        # matching standard expectation.
        OMEGA = 15.0  # sidereal rate arcsec/s per radian of axis error
        A = -OMEGA * cos_phi * sin_H
        B =  OMEGA * cos_H
        C =  OMEGA * (cos_phi * cos_H * sin_dec - math.sin(phi) * cos_dec) / max(cos_dec, 0.01)
        D =  OMEGA * sin_H * sin_dec / max(cos_dec, 0.01)

        mat = np.array([[A, B], [C, D]])
        rhs = np.array([d_dec, d_ra])

        # === Early degeneracy check ===
        # With the corrected formula, det = OMEGA²·[sin(φ)·cos(H) − cos(φ)·tan(δ)],
        # which vanishes when cos(H) = tan(δ)/tan(φ).  For mid-latitudes
        # (φ≈45°, δ≈0–30°) this occurs at HA ≈ ±60°…±90° — well outside the
        # ~3-hour solar window typically used.  In practice this guard rarely
        # fires, but it remains useful for low-dec/low-latitude cases.
        det_signed = float(np.linalg.det(mat))
        det_abs = abs(det_signed)
        MIN_USEFUL_DET = 8.0   # below this, the solution is amplified > 4×

        # Also detect post-singularity sign-flip: after the matrix det crosses
        # zero, fresh solves are MIRROR-IMAGED versions of the pre-singularity
        # answer (same magnitude, flipped sign).  Detect by comparing sign with
        # the cached well-conditioned solve.
        sign_flipped = (
            self._last_good is not None
            and self._last_good_det != 0
            and (det_signed * self._last_good_det) < 0
        )

        if det_abs < MIN_USEFUL_DET or sign_flipped:
            if self._last_good is not None:
                # Return the cached good answer, with an explanatory message
                out = PolarError(
                    azimuth_arcmin    = self._last_good.azimuth_arcmin,
                    altitude_arcmin   = self._last_good.altitude_arcmin,
                    total_arcmin      = self._last_good.total_arcmin,
                    sigma_az_arcmin   = self._last_good.sigma_az_arcmin,
                    sigma_alt_arcmin  = self._last_good.sigma_alt_arcmin,
                    az_direction      = self._last_good.az_direction,
                    alt_direction     = self._last_good.alt_direction,
                    correction_az     = self._last_good.correction_az,
                    correction_alt    = self._last_good.correction_alt,
                    hour_angle_deg    = hour_angle,
                    solution_valid    = True,
                    az_screw_turns    = self._last_good.az_screw_turns,
                    az_screw_side     = self._last_good.az_screw_side,
                    alt_screw_turns   = self._last_good.alt_screw_turns,
                    alt_screw_side    = self._last_good.alt_screw_side,
                    message = (
                        f"⚠ Geometry degenerate at HA={hour_angle:.1f}° "
                        f"(|det|={det_abs:.2f}). Showing last good estimate "
                        f"from HA={self._last_good.hour_angle_deg:.1f}° "
                        f"(|det|={self._last_good_det:.1f})."
                    ),
                )
                return out
            else:
                err.message = (
                    f"⚠ Geometry degenerate at HA={hour_angle:.1f}° "
                    f"(|det|={det_abs:.2f}).  Cannot separate Az/Alt errors. "
                    "Wait until sun is far from HA = ±16°."
                )
                return err

        try:
            cond = np.linalg.cond(mat)
            # Threshold lowered.  With cond > 100, the solution is unreliable
            # — values will be amplified.  The matrix becomes truly singular
            # near det → 0 (specific HA × dec combinations).
            geometry_poor = cond > 50.0
            geometry_bad  = cond > 200.0
            if geometry_bad:
                err.message = (
                    f"⚠ Geometry bad (cond={cond:.0f}, HA={hour_angle:.1f}°). "
                    "Cannot reliably separate Az/Alt errors at this hour angle. "
                    "Wait until the sun is ∼3h from the meridian, or use the "
                    "Drift Rate panel to read raw drift rates."
                )
            elif geometry_poor:
                err.message = (
                    f"⚠ Geometry marginal (cond={cond:.0f}, HA={hour_angle:.1f}°). "
                    "Values shown with reduced confidence."
                )
            sol = np.linalg.lstsq(mat, rhs, rcond=None)[0]
        except np.linalg.LinAlgError:
            err.message = "Linear solve failed."
            return err

        # sol is in radians; convert to arcminutes
        az_rad, alt_rad = sol
        az_arcmin  = math.degrees(az_rad)  * 60.0
        alt_arcmin = math.degrees(alt_rad) * 60.0

        # DIAGNOSTIC: log all intermediate values when we get suspicious results
        # so we can debug.  Threshold: > 300' total error is "very large".
        total_prelim = math.sqrt(az_arcmin ** 2 + alt_arcmin ** 2)
        if total_prelim > 300.0:
            logger.warning(
                "Suspicious polar solve:\n"
                "  drift in:  d_dec=%.4f d_ra=%.4f arcsec/s "
                "(%.2f, %.2f arcsec/min)\n"
                "  geometry: lat=%.2f° HA=%.2f° dec=%.2f°\n"
                "  matrix:   A=%.3f B=%.3f C=%.3f D=%.3f det=%.3f\n"
                "  solution: az_rad=%.5f alt_rad=%.5f → %.1f' / %.1f'",
                d_dec, d_ra,
                drift.drift_dec_arcsec_min, drift.drift_ra_arcsec_min,
                math.degrees(phi), hour_angle, math.degrees(delta),
                A, B, C, D, np.linalg.det(mat),
                az_rad, alt_rad, az_arcmin, alt_arcmin,
            )

        # Sanity clamp: anything > 600 arcmin (10°) is unphysical for a mount
        # that's actually tracking the sun.  Cap the displayed value but mark
        # as low confidence.
        CLAMP_ARCMIN = 600.0
        clamped = False
        if abs(az_arcmin) > CLAMP_ARCMIN or abs(alt_arcmin) > CLAMP_ARCMIN:
            logger.warning(
                "Polar error exceeds clamp limit (±%.0f'). "
                "Reported Az=%+.1f', Alt=%+.1f'. "
                "Likely a tracking-rate or coordinate-frame mismatch.",
                CLAMP_ARCMIN, az_arcmin, alt_arcmin,
            )
            az_arcmin  = max(-CLAMP_ARCMIN, min(CLAMP_ARCMIN, az_arcmin))
            alt_arcmin = max(-CLAMP_ARCMIN, min(CLAMP_ARCMIN, alt_arcmin))
            clamped = True

        # Propagate uncertainties
        sigma_dec = drift.sigma_dec_arcsec_min / 60.0
        sigma_ra  = drift.sigma_ra_arcsec_min  / 60.0
        try:
            inv_mat = np.linalg.pinv(mat)
            sigma_sol = np.sqrt(
                (inv_mat[:, 0] * sigma_dec) ** 2 +
                (inv_mat[:, 1] * sigma_ra)  ** 2
            )
            sigma_az  = math.degrees(sigma_sol[0]) * 60.0
            sigma_alt = math.degrees(sigma_sol[1]) * 60.0
        except Exception:
            sigma_az = sigma_alt = 0.0

        total = math.sqrt(az_arcmin ** 2 + alt_arcmin ** 2)

        # Direction strings
        az_dir  = "East" if az_arcmin > 0 else "West"
        alt_dir = "Up"   if alt_arcmin < 0 else "Down"

        # Correction strings
        def _fmt(val: float, unit: str = "arcmin") -> str:
            return f"{abs(val):.1f} {unit}"

        corr_az  = f"Rotate polar axis {_fmt(az_arcmin)} toward {az_dir}"
        corr_alt = f"Tilt polar axis {_fmt(alt_arcmin)} {alt_dir}"

        err.azimuth_arcmin  = az_arcmin
        err.altitude_arcmin = alt_arcmin
        err.total_arcmin    = total
        err.az_direction    = az_dir
        err.alt_direction   = alt_dir
        err.sigma_az_arcmin  = sigma_az
        err.sigma_alt_arcmin = sigma_alt
        err.hour_angle_deg  = hour_angle
        err.sun_dec_deg     = sun_dec
        err.correction_az   = corr_az
        err.correction_alt  = corr_alt
        err.solution_valid  = True
        err.message         = (
            f"Az {az_arcmin:+.1f}′ ({az_dir})   Alt {alt_arcmin:+.1f}′ ({alt_dir})   "
            f"Total {total:.1f}′"
        )

        # Cache this result if it was well-conditioned, for use when geometry
        # later becomes degenerate.  We always update so the cache contains the
        # MOST RECENT well-conditioned estimate (more data → better answer).
        # Store SIGNED det so we can detect sign-flip post-singularity.
        if not clamped and det_abs > MIN_USEFUL_DET:
            self._last_good = err
            self._last_good_det = det_signed

        return err

    # ----------------------------------------------------------------- private

    def _sun_position(self, t: datetime) -> tuple[float, float, float]:
        """
        Compute sun (RA degrees, Dec degrees, hour_angle degrees) at time t.
        Positive hour angle = west of meridian.
        """
        from astropy.coordinates import EarthLocation, get_sun
        from astropy.time import Time
        import astropy.units as u

        location = EarthLocation(
            lat=self._obs.latitude_deg  * u.deg,
            lon=self._obs.longitude_deg * u.deg,
            height=self._obs.altitude_m * u.m,
        )
        astro_time = Time(t)
        sun = get_sun(astro_time)

        ra_deg  = float(sun.ra.deg)
        dec_deg = float(sun.dec.deg)

        # Local Sidereal Time at observer's longitude
        lst = astro_time.sidereal_time("apparent",
                                       longitude=self._obs.longitude_deg * u.deg)
        lst_deg = float(lst.deg)

        # Hour angle: range -180..+180, positive = west of meridian
        ha_deg = (lst_deg - ra_deg) % 360.0
        if ha_deg > 180:
            ha_deg -= 360.0

        return ra_deg, dec_deg, ha_deg


def attach_screw_instructions(
    err: PolarError,
    az_arcmin_per_turn:  float = 30.0,
    alt_arcmin_per_turn: float = 30.0,
    az_right_screw_direction: str = "east",
    invert_correction_directions: bool = False,
) -> PolarError:
    """
    Fills in screw-turn fields on a PolarError result.

    The error sign convention says:
      azimuth_arcmin > 0  →  polar axis too far East   (need to push West)
      altitude_arcmin > 0 →  polar axis too high       (need to tilt Down)

    If ``invert_correction_directions`` is True, all directions are flipped.
    Use this when the camera/optical system shows the sky mirrored so that
    the inferred corrections appear backwards.
    """
    if not err.solution_valid:
        return err

    # Optionally invert the sense of the errors so directions flip
    az_sign   = -1 if invert_correction_directions else +1
    alt_sign  = -1 if invert_correction_directions else +1
    az_eff  = az_sign  * err.azimuth_arcmin
    alt_eff = alt_sign * err.altitude_arcmin

    # --- Azimuth screw ---
    correction_direction = "west" if az_eff > 0 else "east"
    if correction_direction == az_right_screw_direction:
        screw_side = "right"
        screw_sign_az = +1.0
    else:
        screw_side = "left"
        screw_sign_az = -1.0

    az_turns_magnitude = abs(az_eff) / max(az_arcmin_per_turn, 1e-6)
    err.az_screw_turns = screw_sign_az * az_turns_magnitude
    err.az_screw_side  = screw_side

    # --- Altitude screw ---
    alt_side = "down" if alt_eff > 0 else "up"
    screw_sign_alt = -1.0 if alt_eff > 0 else +1.0
    alt_turns_magnitude = abs(alt_eff) / max(alt_arcmin_per_turn, 1e-6)
    err.alt_screw_turns = screw_sign_alt * alt_turns_magnitude
    err.alt_screw_side  = alt_side

    # Build human-readable strings  (overwriting the old ones with richer text)
    err.correction_az = (
        f"Azimuth: turn the {screw_side.upper()} screw "
        f"{az_turns_magnitude:.2f} turn"
        f"{'s' if az_turns_magnitude != 1 else ''} "
        f"(= {abs(err.azimuth_arcmin):.1f}′)"
    )
    err.correction_alt = (
        f"Altitude: turn the altitude screw {alt_side.upper()} by "
        f"{alt_turns_magnitude:.2f} turn"
        f"{'s' if alt_turns_magnitude != 1 else ''} "
        f"(= {abs(err.altitude_arcmin):.1f}′)"
    )
    return err

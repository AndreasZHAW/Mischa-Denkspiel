"""
core/rotation_from_testdata.py
================================
Derive camera rotation from a single drift test where ONE axis was
intentionally misaligned (e.g. azimuth screw turned by some amount).

Idea:
  If you deliberately introduce only an azimuth error, the resulting drift
  in the SKY frame (RA/Dec) has a known direction angle that depends on
  the sun's hour angle and declination.  The DIRECTION (not magnitude) is
  predictable from astropy.

  In the PIXEL frame, we measure a drift vector (dx_px, dy_px).
  The angle between the measured pixel drift and the predicted sky-frame
  drift = camera rotation.

This method is exact only if the perturbed axis is truly singular.
In practice, EQ6 screws may cause small cross-axis motion → ~1° uncertainty.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import numpy as np

from config.config_manager import ObserverConfig

logger = logging.getLogger(__name__)


@dataclass
class RotationFromDataResult:
    success:        bool
    rotation_deg:   float
    uncertainty_deg: float
    message:        str


def derive_rotation_from_drift(
    scenario_type:        str,                # "azimuth_only" or "altitude_only"
    drift_x_px_per_min:   float,
    drift_y_px_per_min:   float,
    observer:             ObserverConfig,
    observation_time:     datetime,
    plate_scale_arcsec_px: float,
    drift_uncertainty_px_per_min: float = 0.1,
) -> RotationFromDataResult:
    """
    Compute camera rotation from a known-axis-misalignment drift measurement.

    Args:
        scenario_type:        "azimuth_only" or "altitude_only"
        drift_x_px_per_min:   measured pixel drift in X direction (px/min)
        drift_y_px_per_min:   measured pixel drift in Y direction (px/min)
        observer:             observer location (lat/lon)
        observation_time:     UTC time of the measurement (mid-session)
        plate_scale_arcsec_px: arcsec per pixel
        drift_uncertainty_px_per_min: 1-sigma uncertainty for error estimate

    Returns:
        ``RotationFromDataResult``.  ``rotation_deg`` is the angle from sensor
        +X axis to celestial east, CCW positive.
    """
    if scenario_type not in ("azimuth_only", "altitude_only"):
        return RotationFromDataResult(
            success=False, rotation_deg=0.0, uncertainty_deg=0.0,
            message=f"Unknown scenario type: {scenario_type}",
        )

    drift_mag_px = math.sqrt(drift_x_px_per_min ** 2 + drift_y_px_per_min ** 2)
    if drift_mag_px < 0.5:
        return RotationFromDataResult(
            success=False, rotation_deg=0.0, uncertainty_deg=0.0,
            message=f"Drift too small ({drift_mag_px:.2f} px/min) – use a larger misalignment.",
        )

    # --- Compute sun position at observation time ---
    try:
        from astropy.coordinates import EarthLocation, get_sun
        from astropy.time import Time
        import astropy.units as u

        loc = EarthLocation(
            lat=observer.latitude_deg * u.deg,
            lon=observer.longitude_deg * u.deg,
            height=observer.altitude_m * u.m,
        )
        t = Time(observation_time)
        sun = get_sun(t)
        ra_deg, dec_deg = float(sun.ra.deg), float(sun.dec.deg)
        lst = t.sidereal_time("apparent", longitude=observer.longitude_deg * u.deg)
        lst_deg = float(lst.deg)
        ha_deg = (lst_deg - ra_deg) % 360.0
        if ha_deg > 180:
            ha_deg -= 360.0
    except Exception as e:
        return RotationFromDataResult(
            success=False, rotation_deg=0.0, uncertainty_deg=0.0,
            message=f"Could not compute sun position: {e}",
        )

    phi = math.radians(observer.latitude_deg)
    H   = math.radians(ha_deg)
    delta = math.radians(dec_deg)

    # Predicted drift direction in SKY (RA, Dec) space for the chosen scenario
    # From the polar-alignment equations:
    #   d(Dec)/dt = -Δaz · cos(φ)·cos(H)  +  Δalt · sin(H)
    #   d(RA)/dt  =  Δaz · (cos(φ)·sin(H)·sin(δ) − sin(φ)·cos(δ)) / cos(δ)
    #              − Δalt · cos(H)·sin(δ) / cos(δ)
    # We need only the DIRECTION (not magnitude), so we can set the perturbation
    # amplitude to 1.
    if scenario_type == "azimuth_only":
        d_dec_unit =  -math.cos(phi) * math.cos(H)
        d_ra_unit  =   (math.cos(phi) * math.sin(H) * math.sin(delta)
                        - math.sin(phi) * math.cos(delta)) / max(math.cos(delta), 0.01)
    else:  # altitude_only
        d_dec_unit =   math.sin(H)
        d_ra_unit  =  -math.cos(H) * math.sin(delta) / max(math.cos(delta), 0.01)

    # Predicted drift-angle in sky frame (CCW from east = +RA axis)
    # Image coordinates: +x = east (sky), +y = north (sky)
    # In our sky frame: x_sky = ΔRA, y_sky = ΔDec
    predicted_sky_angle = math.degrees(math.atan2(d_dec_unit, d_ra_unit))

    # Measured drift direction in PIXEL frame
    # Pixel convention: +x = right, +y = DOWN (toward bottom of image).
    # When camera is unrotated (rotation = 0), pixel +x maps to east on sky
    # and pixel +y maps to SOUTH on sky (because y-down).
    # So we flip Y for the comparison angle:
    measured_pixel_angle = math.degrees(math.atan2(-drift_y_px_per_min,
                                                    drift_x_px_per_min))

    # Camera rotation = predicted_sky_angle - measured_pixel_angle
    # (i.e. how much we'd have to rotate the pixel-frame data to align with sky)
    rotation_deg = (predicted_sky_angle - measured_pixel_angle + 180.0) % 360.0 - 180.0

    # Uncertainty: small angle approx, dominated by drift uncertainty
    relative_unc = drift_uncertainty_px_per_min / drift_mag_px
    uncertainty_deg = math.degrees(relative_unc) * 1.5  # 1.5x safety factor

    msg = (
        f"Scenario {scenario_type}: predicted sky angle {predicted_sky_angle:+.1f}°, "
        f"measured pixel angle {measured_pixel_angle:+.1f}°, "
        f"→ rotation {rotation_deg:+.2f}° ± {uncertainty_deg:.2f}°  "
        f"(Sun HA={ha_deg:+.1f}°, Dec={dec_deg:+.1f}°)"
    )

    return RotationFromDataResult(
        success         = True,
        rotation_deg    = rotation_deg,
        uncertainty_deg = uncertainty_deg,
        message         = msg,
    )

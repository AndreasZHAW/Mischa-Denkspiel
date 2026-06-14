"""
core/refraction.py
==================
Atmospheric refraction correction for solar observations.

Formula: Bennett (1982) approximation (accurate to ~0.07″ above 5°).
  R [arcmin] = cot(a + 7.31 / (a + 4.4))
where a = apparent altitude in degrees.

For SDAA the correction is used to:
  1. Warn the user when refraction-induced uncertainty exceeds a threshold.
  2. Adjust the measured drift rate by the differential refraction across
     the solar disk (affects apparent position of disk centre).

Differential refraction:
  The refraction gradient across the ~32′ solar disk is small but non-zero,
  especially at low elevations.  The disk centre is compressed vertically.
  For SDAA purposes we report this as an additional uncertainty term.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from config.config_manager import RefractionConfig, ObserverConfig


@dataclass
class RefractionInfo:
    """Refraction correction results for a given observation."""
    altitude_deg:       float   # sun's true altitude
    refraction_arcmin:  float   # Bennett refraction amount
    diff_refraction_arcsec: float  # differential refraction across 32′ disk
    warn:               bool    # True if altitude < threshold
    warn_message:       str


def compute_refraction(
    altitude_deg: float,
    cfg: RefractionConfig,
) -> RefractionInfo:
    """
    Compute atmospheric refraction correction.

    Args:
        altitude_deg:  Apparent altitude of target (degrees).
        cfg:           Refraction config.

    Returns:
        ``RefractionInfo`` with correction amount and warnings.
    """
    if not cfg.enabled:
        return RefractionInfo(
            altitude_deg=altitude_deg,
            refraction_arcmin=0.0,
            diff_refraction_arcsec=0.0,
            warn=False,
            warn_message="",
        )

    # Clamp to avoid math issues near horizon
    a = max(altitude_deg, 0.5)

    # Pressure/temperature correction factor
    f = (cfg.pressure_hPa / 1010.0) * (283.0 / (273.0 + cfg.temperature_C))

    # Bennett formula (arcmin)
    r_arcmin = f / math.tan(math.radians(a + 7.31 / (a + 4.4)))

    # Differential refraction across solar disk (~32 arcmin diameter = 16 arcmin radius)
    # dR/da [arcmin/arcmin] ≈ -R / (a+4.4) * (1/(a+4.4) + tan(a+7.31/(a+4.4))...)
    # Simple numerical derivative:
    delta = 16.0 / 60.0  # half solar diameter in degrees
    r_top    = f / math.tan(math.radians(a + delta + 7.31 / (a + delta + 4.4)))
    r_bottom = f / math.tan(math.radians(a - delta + 7.31 / (a - delta + 4.4)))
    diff_r_arcmin  = r_bottom - r_top    # bottom limb refracts more than top
    diff_r_arcsec  = diff_r_arcmin * 60.0

    warn = altitude_deg < cfg.warn_below_altitude_deg
    warn_msg = ""
    if warn:
        warn_msg = (
            f"⚠ Sun altitude {altitude_deg:.1f}° < {cfg.warn_below_altitude_deg:.0f}°.  "
            f"Refraction {r_arcmin:.1f}′ introduces ~{diff_r_arcsec:.0f}″ "
            f"differential across disk.  Accuracy reduced."
        )

    return RefractionInfo(
        altitude_deg=altitude_deg,
        refraction_arcmin=r_arcmin,
        diff_refraction_arcsec=diff_r_arcsec,
        warn=warn,
        warn_message=warn_msg,
    )


def sun_altitude(obs_time: datetime, observer: ObserverConfig) -> float:
    """Return the sun's altitude (degrees) for the given time and location."""
    from astropy.coordinates import get_sun, EarthLocation, AltAz
    from astropy.time import Time
    import astropy.units as u

    loc = EarthLocation(
        lat=observer.latitude_deg  * u.deg,
        lon=observer.longitude_deg * u.deg,
        height=observer.altitude_m * u.m,
    )
    t = Time(obs_time)
    altaz_frame = AltAz(obstime=t, location=loc)
    sun = get_sun(t).transform_to(altaz_frame)
    return float(sun.alt.deg)

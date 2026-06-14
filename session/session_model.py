"""
session/session_model.py
=========================
Dataclasses for a complete SDAA session.
These are serialised to JSON by the SessionManager.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional


@dataclass
class SessionTrackPoint:
    """Serialisable version of a TrackPoint."""
    timestamp_iso: str
    cx_px:         float
    cy_px:         float
    quality:       float
    rms_px:        float
    frame_idx:     int
    status:        str   # OK | OUTLIER | DISABLED | LOW_QUALITY
    radius_px:     float = 0.0
    source_file:   Optional[str] = None
    note:          str   = ""


@dataclass
class SessionDriftSolution:
    drift_ra_arcsec_min:  float
    drift_dec_arcsec_min: float
    sigma_ra_arcsec_min:  float
    sigma_dec_arcsec_min: float
    n_points:             int
    r_squared_x:          float
    r_squared_y:          float
    computed_at_iso:      str


@dataclass
class SessionPolarError:
    azimuth_arcmin:  float
    altitude_arcmin: float
    total_arcmin:    float
    az_direction:    str
    alt_direction:   str
    sigma_az_arcmin: float
    sigma_alt_arcmin: float
    correction_az:   str
    correction_alt:  str
    computed_at_iso: str


@dataclass
class SessionSetup:
    """Equipment setup snapshot saved with the session."""
    camera_model:        str   = ""
    pixel_size_um:        float = 0.0
    focal_length_mm:      float = 0.0
    reducer_factor:       float = 1.0
    plate_scale_arcsec_px: float = 0.0
    mount_model:          str   = ""
    tracking_rate:        str   = ""
    observer_lat:         float = 0.0
    observer_lon:         float = 0.0
    observer_alt_m:       float = 0.0
    camera_rotation_deg:  float = 0.0
    sdaa_version:         str   = ""


@dataclass
class Session:
    """Complete session record."""
    session_id:   str          # ISO timestamp used as unique ID
    created_iso:  str
    updated_iso:  str
    setup:        SessionSetup = field(default_factory=SessionSetup)
    points:       list[SessionTrackPoint]       = field(default_factory=list)
    drift_solutions: list[SessionDriftSolution] = field(default_factory=list)
    polar_errors:    list[SessionPolarError]    = field(default_factory=list)
    notes:        str = ""

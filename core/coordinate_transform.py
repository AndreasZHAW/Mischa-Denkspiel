"""
core/coordinate_transform.py
==============================
Converts pixel coordinates to sky (RA/Dec offset) coordinates and vice versa,
using the camera rotation angle and plate scale from calibration.

Also provides the camera rotation calibration computation:
  Given two sun positions before/after a pure RA slew,
  compute the angle between the pixel displacement vector and RA direction.
"""

from __future__ import annotations

import math
import numpy as np


class PixelSkyTransform:
    """
    Transforms between pixel displacements and sky angle offsets.

    Args:
        plate_scale_arcsec_px:  arcsec per pixel
        camera_rotation_deg:    angle from pixel +X axis to celestial East (deg, CCW positive)
    """

    def __init__(
        self,
        plate_scale_arcsec_px: float,
        camera_rotation_deg: float = 0.0,
    ) -> None:
        self._ps    = plate_scale_arcsec_px
        self._theta = math.radians(camera_rotation_deg)
        self._cos   = math.cos(self._theta)
        self._sin   = math.sin(self._theta)

    # ------------------------------------------------------------------ public

    def pixel_to_sky(
        self,
        dx_px: float,
        dy_px: float,
    ) -> tuple[float, float]:
        """
        Convert pixel displacement (dx, dy) to sky offset (dRA, dDec) in arcsec.

        Pixel convention: +x = right, +y = down.
        Sky convention:   +RA = East, +Dec = North.
        """
        # Scale
        dx_as = dx_px * self._ps
        dy_as = dy_px * self._ps   # positive = southward before rotation

        # Rotate: pixel frame → sky frame
        # East (RA) direction in pixel frame makes angle θ with pixel +X axis
        dra  =  dx_as * self._cos + dy_as * self._sin
        ddec = -dx_as * self._sin + dy_as * self._cos
        # Dec sign: +pixel_y is down (southward) → -Dec after unrotating
        ddec = -ddec

        return dra, ddec

    def sky_to_pixel(
        self,
        dra_arcsec: float,
        ddec_arcsec: float,
    ) -> tuple[float, float]:
        """Inverse: sky offset → pixel displacement."""
        # Flip Dec sign
        ddec_px_frame = -ddec_arcsec
        # Inverse rotation
        dx_as =  dra_arcsec * self._cos - ddec_px_frame * self._sin
        dy_as =  dra_arcsec * self._sin + ddec_px_frame * self._cos
        return dx_as / self._ps, dy_as / self._ps

    def update_rotation(self, camera_rotation_deg: float) -> None:
        """Update the rotation angle (e.g. after calibration wizard)."""
        self._theta = math.radians(camera_rotation_deg)
        self._cos   = math.cos(self._theta)
        self._sin   = math.sin(self._theta)


# ---------------------------------------------------------------------------
# Camera rotation calibration
# ---------------------------------------------------------------------------

def compute_camera_rotation(
    pos_before: tuple[float, float],  # (cx, cy) in pixels before RA slew
    pos_after:  tuple[float, float],  # (cx, cy) in pixels after  RA slew
    slew_direction: str = "east",     # "east" or "west"
) -> tuple[float, float]:
    """
    Compute camera rotation angle from a known RA slew.

    When the mount performs a pure RA slew:
    - The star/sun moves along the celestial equator (exactly East or West).
    - The pixel displacement vector tells us where East is in pixel space.
    - The angle between that vector and pixel +X axis is the camera rotation.

    Returns:
        (camera_rotation_deg, uncertainty_deg)

    Args:
        pos_before:       Sun centre before slew  (cx, cy)
        pos_after:        Sun centre after slew   (cx, cy)
        slew_direction:   "east" if mount slewed East, "west" if West.
    """
    dx = pos_after[0] - pos_before[0]
    dy = pos_after[1] - pos_before[1]
    displacement = math.sqrt(dx ** 2 + dy ** 2)

    if displacement < 2.0:
        raise ValueError(
            "Displacement too small (< 2 px).  Perform a larger RA slew (≥ 5 arcmin)."
        )

    # Angle of displacement vector in pixel space (CCW from +X)
    angle_px = math.degrees(math.atan2(-dy, dx))  # flip y because pixel-y is down

    if slew_direction.lower() == "west":
        angle_px += 180.0

    # Normalise to [-180, 180]
    angle_px = (angle_px + 180) % 360 - 180

    # Uncertainty: assume ~0.5 px localisation error in each position measurement
    localisation_error_px = 0.5
    uncertainty_deg = math.degrees(2 * localisation_error_px / displacement)

    return angle_px, uncertainty_deg

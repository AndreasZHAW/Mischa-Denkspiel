"""
ascom/eqmod_driver.py
======================
EQMOD.Telescope driver via win32com.

On Windows with EQMOD installed: fully functional.
On other platforms: raises AscomUnavailableError at connect().
"""
from __future__ import annotations
import logging
from typing import Optional
from ascom.mount_interface import MountDriver, MountPosition, AscomUnavailableError

logger = logging.getLogger(__name__)


class EqmodDriver(MountDriver):
    """EQMOD ASCOM driver (win32com)."""

    def __init__(self, prog_id: str = "EQMOD.Telescope") -> None:
        self._prog_id    = prog_id
        self._telescope  = None
        self._connected  = False

    def connect(self) -> None:
        try:
            import win32com.client  # type: ignore
        except ImportError:
            raise AscomUnavailableError(
                "pywin32 not installed.  ASCOM requires Windows + pywin32.\n"
                "Install with:  pip install pywin32"
            )
        try:
            self._telescope = win32com.client.Dispatch(self._prog_id)
            self._telescope.Connected = True
            self._connected = True
            logger.info("EQMOD connected via %s", self._prog_id)
        except Exception as e:
            raise ConnectionError(f"Could not connect to EQMOD ({self._prog_id}): {e}") from e

    def disconnect(self) -> None:
        if self._telescope and self._connected:
            try:
                self._telescope.Connected = False
            except Exception:
                pass
        self._connected = False
        self._telescope = None
        logger.info("EQMOD disconnected")

    @property
    def is_connected(self) -> bool:
        return self._connected

    def get_position(self) -> Optional[MountPosition]:
        if not self._connected or self._telescope is None:
            return None
        try:
            return MountPosition(
                ra_hours   = float(self._telescope.RightAscension),
                dec_deg    = float(self._telescope.Declination),
                alt_deg    = float(self._telescope.Altitude),
                az_deg     = float(self._telescope.Azimuth),
                is_tracking= bool(self._telescope.Tracking),
                pier_side  = str(self._telescope.SideOfPier),
            )
        except Exception as e:
            logger.warning("EQMOD get_position error: %s", e)
            return None

    def get_ra_dec(self) -> Optional[tuple[float, float]]:
        pos = self.get_position()
        return (pos.ra_hours, pos.dec_deg) if pos else None

    def slew_ra_delta(self, delta_arcsec: float) -> None:
        """Move RA axis by delta_arcsec (+ = East)."""
        if not self._connected:
            raise ConnectionError("Not connected")
        # TODO: implement via MoveAxis or SlewToCoordinatesAsync
        # For safety, not implemented until Phase 2 validation
        raise NotImplementedError("Auto-correction slews: coming in Phase 2.")

    def slew_dec_delta(self, delta_arcsec: float) -> None:
        if not self._connected:
            raise ConnectionError("Not connected")
        raise NotImplementedError("Auto-correction slews: coming in Phase 2.")

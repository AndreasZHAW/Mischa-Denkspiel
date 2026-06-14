"""
ascom/mount_interface.py
========================
Abstract base class for mount drivers.

Concrete implementations:
  - EqmodDriver  (EQMOD.Telescope  via win32com)
  - GsServerDriver (GS Server)

On non-Windows platforms or when pywin32 is not installed, the drivers
raise ``AscomUnavailableError`` at connect time.

Extension point:
  To add a new driver:
    1. Subclass ``MountDriver``
    2. Implement all abstract methods
    3. Register in ``MOUNT_DRIVERS`` dict in this file
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


class AscomUnavailableError(RuntimeError):
    """Raised when ASCOM / pywin32 is not available on this platform."""


@dataclass
class MountPosition:
    """Current telescope position."""
    ra_hours:  float    # Right Ascension in decimal hours
    dec_deg:   float    # Declination in degrees
    alt_deg:   float    # Altitude
    az_deg:    float    # Azimuth
    is_tracking: bool   # True if mount is currently tracking
    pier_side:  str     # "East" | "West" | "Unknown"


class MountDriver(ABC):
    """
    Abstract mount driver.
    All methods are safe to call from any thread.
    """

    # ------------------------------------------------------------------ lifecycle

    @abstractmethod
    def connect(self) -> None:
        """Connect to the mount.  Raises on failure."""

    @abstractmethod
    def disconnect(self) -> None:
        """Disconnect cleanly."""

    @property
    @abstractmethod
    def is_connected(self) -> bool:
        """True if currently connected."""

    # ------------------------------------------------------------------ queries

    @abstractmethod
    def get_position(self) -> Optional[MountPosition]:
        """Return current mount position, or None if not connected."""

    @abstractmethod
    def get_ra_dec(self) -> Optional[tuple[float, float]]:
        """Return (RA hours, Dec degrees), or None if not connected."""

    # ------------------------------------------------------------------ control  (optional)

    def slew_ra_delta(self, delta_arcsec: float) -> None:
        """
        Perform a small RA correction slew.
        Override in subclasses that support auto-correction.
        Default implementation raises NotImplementedError.
        """
        raise NotImplementedError(
            f"{type(self).__name__} does not support auto-correction slews."
        )

    def slew_dec_delta(self, delta_arcsec: float) -> None:
        raise NotImplementedError(
            f"{type(self).__name__} does not support auto-correction slews."
        )

    def abort_slew(self) -> None:
        pass  # optional, safe no-op default

    # ------------------------------------------------------------------ factory

    @staticmethod
    def create(driver_name: str, prog_id: str) -> "MountDriver":
        """
        Factory: create a driver by name.
        driver_name: "eqmod" | "gs_server"
        """
        from ascom.eqmod_driver import EqmodDriver
        from ascom.gs_server_driver import GsServerDriver

        drivers = {
            "eqmod":     EqmodDriver,
            "gs_server": GsServerDriver,
        }
        cls = drivers.get(driver_name.lower())
        if cls is None:
            raise ValueError(
                f"Unknown ASCOM driver: {driver_name!r}.  "
                f"Available: {list(drivers.keys())}"
            )
        return cls(prog_id=prog_id)

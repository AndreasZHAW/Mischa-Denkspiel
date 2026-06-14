"""
ascom/gs_server_driver.py
==========================
Green Swamp Server (GS Server) ASCOM driver.
Identical interface to EqmodDriver – only the ProgID differs.
"""
from __future__ import annotations
from ascom.eqmod_driver import EqmodDriver


class GsServerDriver(EqmodDriver):
    """GS Server ASCOM driver (subclasses EqmodDriver, different ProgID)."""

    def __init__(self, prog_id: str = "GS.Telescope") -> None:
        super().__init__(prog_id=prog_id)

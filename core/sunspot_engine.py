"""
core/sunspot_engine.py
=======================
Sunspot detection engine.

STATUS: PLACEHOLDER – not yet implemented.

When implemented this module will:
  1. Detect dark regions (sunspots) within the solar disk.
  2. Track them as stable feature points between frames.
  3. Provide sub-pixel refinement of the disk centre by fitting to
     known sunspot positions.

Interface (to be implemented):
    detect_sunspots(frame: PreprocessedFrame, disk: SunDetectionResult)
      -> list[SunspotPoint]
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from core.preprocessing import PreprocessedFrame
    from core.sun_detection import SunDetectionResult


@dataclass
class SunspotPoint:
    cx_px:  float
    cy_px:  float
    area_px2: float
    contrast: float   # 0 = as bright as disk, 1 = completely black


def detect_sunspots(
    frame: "PreprocessedFrame",
    disk: "SunDetectionResult",
    enabled: bool = False,
) -> list[SunspotPoint]:
    """
    Detect sunspots.

    Returns empty list if ``enabled=False`` (default) or not yet implemented.
    """
    # TODO: implement in Phase 2
    return []

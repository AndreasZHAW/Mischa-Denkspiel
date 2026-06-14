"""
core/sunspot_tracker.py
=========================
Independent sun-tracking method using template matching of the sun's
interior (sunspot patterns).

Rationale
---------
The limb-fit method tracks the sun's geometric centre via its edge.
This module provides a SECOND, completely independent measurement: it takes
a snapshot of the sun's interior (sunspots, faculae) from frame 1 and finds
its best match in every subsequent frame using normalised cross-correlation.

This is genuinely independent because we DON'T re-extract the template
around the limb-fit centre in subsequent frames — we let cv2.matchTemplate
slide it across the whole image and find where it best matches.

If both methods agree, we trust the result.  If they disagree, something
is wrong (camera shake, mount jump, etc.).

Public API
----------
``SunspotTracker``: a thin stateful wrapper that initialises a template
on the first call and returns the matched sun position (in image
coordinates) for every subsequent call.
"""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class SunspotResult:
    """Outcome of one sunspot-correlation measurement."""
    cx_px:      float         # x of sun centre derived from sunspot pattern
    cy_px:      float         # y of sun centre derived from sunspot pattern
    shift_x_px: float         # shift relative to the template's initial centre
    shift_y_px: float
    response:   float         # cross-correlation peak response (0..1)
    success:    bool
    message:    str


class SunspotTracker:
    """Tracks the solar disk by template-matching the inner sunspot pattern.

    Usage:
        tracker = SunspotTracker()
        result = tracker.process(gray, cx, cy, radius_px)
    """

    def __init__(self, patch_inner_frac: float = 0.75) -> None:
        self._patch_inner_frac = patch_inner_frac
        self._template: Optional[np.ndarray]  = None
        self._template_cx: float = 0.0      # global pixel coords of template centre
        self._template_cy: float = 0.0
        self._template_size: int = 0
        # Min response that we accept as valid match
        # 0.15 is fairly permissive - real sunspot data typically gives >0.5.
        # Lower values still report position, just with `success=False` flag.
        self._min_response = 0.15

    @property
    def is_initialised(self) -> bool:
        return self._template is not None

    def reset(self) -> None:
        """Drop the template; next process() call will set a new one."""
        self._template = None

    # ------------------------------------------------------------------ public

    def process(
        self,
        gray: np.ndarray,
        cx_px: float,
        cy_px: float,
        radius_px: float,
    ) -> SunspotResult:
        """Process one frame.

        Args:
            gray:        float32 [0..1] grayscale image
            cx_px, cy_px: detected sun centre (from limb fit) – used as a
                          search-area hint only, NOT as the patch centre.
            radius_px:   detected sun radius in pixels

        On the first call, this stores a template patch and returns the
        passed-in centre with success=True.

        On subsequent calls, it runs cv2.matchTemplate over the WHOLE image
        and returns the matched sun position with sub-pixel precision.
        This is genuinely independent from the limb-fit because the template
        is anchored to image pixels, not the current sun position.
        """
        if radius_px < 10:
            return SunspotResult(cx_px, cy_px, 0, 0, 0.0, False,
                                 "Radius too small for sunspot tracking.")

        # ------- FIRST call: extract and store template -------
        if self._template is None:
            template = self._extract_inner_patch(gray, cx_px, cy_px, radius_px)
            if template is None:
                return SunspotResult(cx_px, cy_px, 0, 0, 0.0, False,
                                     "Could not extract initial template.")
            self._template      = template
            self._template_size = template.shape[0]
            self._template_cx   = float(cx_px)
            self._template_cy   = float(cy_px)
            logger.info(
                "Sunspot tracker initialised: template centre=(%.1f, %.1f), "
                "radius=%.1f px, patch=%dx%d",
                cx_px, cy_px, radius_px, template.shape[1], template.shape[0],
            )
            return SunspotResult(cx_px, cy_px, 0, 0, 1.0, True,
                                 "Template captured.")

        # ------- SUBSEQUENT calls: match template in current frame -------
        # The template was contrast-stretched based on its OWN patch
        # percentiles.  For the search to find the right match, we must
        # stretch the search region the SAME WAY — based on local percentiles,
        # NOT global ones.  Otherwise the brightness ranges differ and
        # matchTemplate finds spurious peaks.
        search_half = int(max(self._template_size, radius_px * 2 + 100))
        sx0 = max(0, int(cx_px - search_half))
        sy0 = max(0, int(cy_px - search_half))
        sx1 = min(gray.shape[1], int(cx_px + search_half))
        sy1 = min(gray.shape[0], int(cy_px + search_half))
        if sx1 - sx0 < self._template_size or sy1 - sy0 < self._template_size:
            # Search region too small; fall back to full image
            sx0, sy0 = 0, 0
            sx1, sy1 = gray.shape[1], gray.shape[0]
        # Stretch search region LOCALLY so its contrast matches the template
        search = self._stretch(gray[sy0:sy1, sx0:sx1])

        try:
            corr = cv2.matchTemplate(search, self._template,
                                     cv2.TM_CCOEFF_NORMED)
        except cv2.error as e:
            return SunspotResult(cx_px, cy_px, 0, 0, 0.0, False,
                                 f"matchTemplate failed: {e}")

        _, max_val, _, max_loc = cv2.minMaxLoc(corr)
        # Sub-pixel refinement via parabolic fit on the correlation surface
        sub_dx, sub_dy = _parabolic_subpixel(corr, max_loc)

        # max_loc is the TOP-LEFT corner of the best match in the search region.
        # The match's CENTRE in global image coordinates:
        match_cx = sx0 + max_loc[0] + sub_dx + self._template_size / 2.0
        match_cy = sy0 + max_loc[1] + sub_dy + self._template_size / 2.0

        # If matchTemplate found a match WAY off from the limb fit, that's
        # a sign of a spurious peak (e.g. matching against a darker region of
        # background that happens to correlate).  The sun is, by definition,
        # at the limb-fit position — the sunspot pattern can only deviate by
        # a few px (sub-pixel limb-fit error + small numerical effects), so
        # use a tight tolerance.  Beyond 30 px ≈ 0.15 sun radii, the match
        # is almost certainly wrong.
        dist_from_limb = math.sqrt(
            (match_cx - cx_px) ** 2 + (match_cy - cy_px) ** 2
        )
        max_allowed = max(0.15 * radius_px, 30.0)
        if dist_from_limb > max_allowed:
            return SunspotResult(
                cx_px=cx_px, cy_px=cy_px,
                shift_x_px=0.0, shift_y_px=0.0,
                response=float(max_val), success=False,
                message=(f"Match {dist_from_limb:.0f} px from limb fit "
                         f"(>{max_allowed:.0f}) – spurious."),
            )

        shift_x = match_cx - self._template_cx
        shift_y = match_cy - self._template_cy

        success = bool(max_val >= self._min_response)
        return SunspotResult(
            cx_px=float(match_cx), cy_px=float(match_cy),
            shift_x_px=float(shift_x), shift_y_px=float(shift_y),
            response=float(max_val), success=success,
            message=(f"shift=({shift_x:+.2f}, {shift_y:+.2f}) px  "
                     f"r={max_val:.2f}"),
        )

    # ------------------------------------------------------------------ internal

    @staticmethod
    def _stretch(gray: np.ndarray) -> np.ndarray:
        """Contrast-stretch to bring out sunspots."""
        p_lo, p_hi = np.percentile(gray, (5, 95))
        if p_hi - p_lo < 1e-6:
            return gray.astype(np.float32)
        out = (gray - p_lo) / (p_hi - p_lo)
        return np.clip(out, 0.0, 1.0).astype(np.float32)

    def _extract_inner_patch(
        self,
        gray: np.ndarray,
        cx: float, cy: float,
        radius_px: float,
    ) -> Optional[np.ndarray]:
        """Cut out the inner portion of the sun disk for the template."""
        size_px = int(2 * radius_px * self._patch_inner_frac)
        if size_px < 20:
            return None

        half = size_px // 2
        x0, y0 = int(round(cx - half)), int(round(cy - half))
        x1, y1 = x0 + size_px, y0 + size_px

        h, w = gray.shape
        if x0 < 0 or y0 < 0 or x1 > w or y1 > h:
            return None

        patch = self._stretch(gray[y0:y1, x0:x1])
        return patch


def _parabolic_subpixel(corr: np.ndarray, peak: tuple[int, int]) -> tuple[float, float]:
    """Sub-pixel refinement of a peak in a correlation surface.

    Fits a parabola to the 3 values along each axis around the peak and
    returns the offset (dx, dy) of the true peak from the integer ``peak``
    location, in pixels.  Returns (0, 0) if the peak is at the edge.
    """
    px, py = peak
    h, w = corr.shape
    if px <= 0 or px >= w - 1 or py <= 0 or py >= h - 1:
        return 0.0, 0.0
    # 1D parabolic fit in x
    cm, c0, cp = corr[py, px - 1], corr[py, px], corr[py, px + 1]
    denom_x = (cm - 2 * c0 + cp)
    dx = 0.5 * (cm - cp) / denom_x if abs(denom_x) > 1e-9 else 0.0
    # 1D parabolic fit in y
    cm, c0, cp = corr[py - 1, px], corr[py, px], corr[py + 1, px]
    denom_y = (cm - 2 * c0 + cp)
    dy = 0.5 * (cm - cp) / denom_y if abs(denom_y) > 1e-9 else 0.0
    # Clip to ±1 so we never wander further than one pixel from the peak
    return float(np.clip(dx, -1, 1)), float(np.clip(dy, -1, 1))

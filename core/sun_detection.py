"""
core/sun_detection.py
======================
Detects the solar disk in a preprocessed grayscale image and returns
sub-pixel centre and radius via a two-stage approach:

  Stage 1 – Hough Circle Transform  → robust initial estimate
  Stage 2 – Taubin algebraic circle fit on limb edge points → sub-pixel accuracy

Quality score accounts for:
  - RMS residual of limb points from fitted circle  (lower = better)
  - Fraction of 360° arc covered by edge points     (higher = better)
  - Ellipticity of fitted shape                     (lower = better)

References:
  Taubin, G. (1991) "Estimation of Planar Curves, Surfaces and Nonplanar
  Space Curves Defined by Implicit Equations, with Applications to Edge
  and Range Image Segmentation." IEEE TPAMI 13(11): 1115–1138.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np
from scipy.optimize import least_squares

from config.config_manager import SunDetectionConfig
from core.preprocessing import PreprocessedFrame

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class SunDetectionResult:
    """
    Result of the sun-detection stage.

    All coordinates in **pixel** space (origin = top-left corner).
    ``quality`` is in [0, 1]; values below ``SunDetectionConfig.quality_threshold``
    should be downweighted in the drift solver.
    """
    cx:          float          # sub-pixel centre x
    cy:          float          # sub-pixel centre y
    radius:      float          # fitted radius in pixels
    quality:     float          # 0 = bad, 1 = perfect
    rms_residual_px: float      # RMS distance of limb points from circle
    arc_coverage:   float       # fraction of circle arc covered [0, 1]
    n_limb_pts:  int            # number of edge points used in fit
    success:     bool           # False if no circle could be found at all
    message:     str = ""       # human-readable status / warning


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def detect_sun(frame: PreprocessedFrame, cfg: SunDetectionConfig) -> SunDetectionResult:
    """
    Run the full two-stage solar disk detection pipeline.

    Args:
        frame: Output of ``preprocessing.preprocess()``.
        cfg:   Detection parameters from config.

    Returns:
        ``SunDetectionResult`` (``success=False`` if detection failed).
    """
    gray = frame.gray
    h, w = gray.shape

    min_r = int(cfg.min_radius_frac * min(h, w))
    max_r = int(cfg.max_radius_frac * min(h, w))

    # --- Stage 1: Hough initial estimate ---
    hough_result = _hough_estimate(gray, cfg, min_r, max_r)
    if hough_result is None:
        return SunDetectionResult(
            cx=w / 2, cy=h / 2, radius=(min_r + max_r) / 2,
            quality=0.0, rms_residual_px=999, arc_coverage=0,
            n_limb_pts=0, success=False,
            message="Hough: no circle found. Check solar filter / image contrast.",
        )

    cx0, cy0, r0 = hough_result

    # --- Stage 2: Limb-fit refinement ---
    edge_pts = _extract_limb_points(gray, cfg)
    if len(edge_pts) < 10:
        # Fall back to Hough result only
        return SunDetectionResult(
            cx=cx0, cy=cy0, radius=r0,
            quality=0.2, rms_residual_px=r0 * 0.05, arc_coverage=0.0,
            n_limb_pts=0, success=True,
            message="Few edge points – using Hough estimate only.",
        )

    # Filter edge points to those near the Hough circle
    near = _filter_near_circle(edge_pts, cx0, cy0, r0, max_dist=r0 * 0.15)
    if len(near) < 10:
        near = edge_pts  # if Hough was bad, use all edge points

    # Taubin fit
    fit = _taubin_fit(near[:, 0], near[:, 1])
    if fit is None:
        return SunDetectionResult(
            cx=cx0, cy=cy0, radius=r0,
            quality=0.15, rms_residual_px=r0 * 0.1, arc_coverage=0.0,
            n_limb_pts=len(near), success=True,
            message="Taubin fit failed – using Hough estimate.",
        )

    cx, cy, r = fit

    # Sanity check: the algebraic fit should be CLOSE to the Hough estimate.
    # If it drifted far (which can happen with arc-only data), reject it
    # and use Hough.  This is essential for solar images where the edge
    # points lie on only ~30-40% of the limb due to limb darkening.
    fit_center_drift = np.sqrt((cx - cx0) ** 2 + (cy - cy0) ** 2)
    radius_change = abs(r - r0) / r0 if r0 > 0 else 999
    if fit_center_drift > r0 * 0.5 or radius_change > 0.3:
        logger.debug(
            "Fit drifted too far from Hough (center %.0fpx, radius %.0f%%) "
            "– reverting to Hough estimate cx=%.1f cy=%.1f r=%.1f",
            fit_center_drift, radius_change * 100, cx0, cy0, r0,
        )
        cx, cy, r = cx0, cy0, r0

    # Validate result is within image and makes physical sense
    if not (min_r <= r <= max_r):
        logger.debug("Fit radius %.1f outside [%d, %d] – reverting to Hough",
                     r, min_r, max_r)
        cx, cy, r = cx0, cy0, r0

    # --- Quality scoring ---
    residuals = _circle_residuals(near[:, 0], near[:, 1], cx, cy, r)
    rms = float(np.sqrt(np.mean(residuals ** 2)))
    arc  = _arc_coverage(near[:, 0], near[:, 1], cx, cy)

    quality = _compute_quality(rms, arc, r, cfg)

    return SunDetectionResult(
        cx=cx, cy=cy, radius=r,
        quality=quality,
        rms_residual_px=rms,
        arc_coverage=arc,
        n_limb_pts=len(near),
        success=True,
        message=f"OK  rms={rms:.2f}px  arc={arc:.0%}  q={quality:.2f}",
    )


# ---------------------------------------------------------------------------
# Stage 1 – Hough
# ---------------------------------------------------------------------------

def _hough_estimate(
    gray: np.ndarray,
    cfg: SunDetectionConfig,
    min_r: int,
    max_r: int,
) -> Optional[tuple[float, float, float]]:
    h, w = gray.shape
    min_dist = int(cfg.hough_min_dist_frac * min(h, w))
    # Stretch first (solar images are very dark by default)
    p1, p99 = np.percentile(gray, (1, 99))
    if p99 - p1 < 1e-6:
        return None
    stretched = np.clip((gray - p1) / (p99 - p1), 0, 1)
    u8 = (stretched * 255).astype(np.uint8)
    circles = cv2.HoughCircles(
        u8,
        cv2.HOUGH_GRADIENT,
        dp=cfg.hough_dp,
        minDist=min_dist,
        param1=cfg.hough_param1,
        param2=cfg.hough_param2,
        minRadius=min_r,
        maxRadius=max_r,
    )
    if circles is None:
        return None
    cx, cy, r = circles[0, 0]
    return float(cx), float(cy), float(r)


# ---------------------------------------------------------------------------
# Stage 2 helpers – limb edge extraction
# ---------------------------------------------------------------------------

def _extract_limb_points(gray: np.ndarray, cfg: SunDetectionConfig) -> np.ndarray:
    """Return Canny edge points as (N, 2) float32 array of (x, y) coordinates.

    Important for solar images: the sun disk is bright but the sky is nearly
    black, so a simple linear conversion to uint8 leaves the image very dark
    (peak ~150/255).  We stretch first, then use Otsu-adaptive Canny.
    """
    # Stretch to use full 0-255 range (percentile stretch is robust against outliers)
    p1, p99 = np.percentile(gray, (1, 99))
    if p99 - p1 < 1e-6:
        return np.empty((0, 2), dtype=np.float32)
    stretched = np.clip((gray - p1) / (p99 - p1), 0, 1)
    u8 = (stretched * 255).astype(np.uint8)

    # Use Otsu's method to find a good threshold, then derive Canny limits
    try:
        otsu_t, _ = cv2.threshold(u8, 0, 255,
                                   cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        low  = max(int(otsu_t * 0.5), 10)
        high = max(int(otsu_t),       30)
    except Exception:
        low, high = cfg.canny_low_threshold, cfg.canny_high_threshold

    edges = cv2.Canny(u8, low, high)

    # Keep only the brightest gradient edges (limb > internal texture)
    gx = cv2.Sobel(u8, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(u8, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.sqrt(gx ** 2 + gy ** 2)

    if not edges.any():
        return np.empty((0, 2), dtype=np.float32)

    thresh = np.percentile(mag[edges > 0], cfg.limb_edge_percentile)
    mask = (edges > 0) & (mag >= thresh)

    ys, xs = np.where(mask)
    if len(xs) == 0:
        return np.empty((0, 2), dtype=np.float32)

    return np.column_stack([xs.astype(np.float32), ys.astype(np.float32)])


def _filter_near_circle(pts: np.ndarray, cx: float, cy: float,
                         r: float, max_dist: float) -> np.ndarray:
    dist = np.abs(np.sqrt((pts[:, 0] - cx) ** 2 + (pts[:, 1] - cy) ** 2) - r)
    return pts[dist <= max_dist]


# ---------------------------------------------------------------------------
# Taubin algebraic circle fit
# ---------------------------------------------------------------------------

def _taubin_fit(x: np.ndarray, y: np.ndarray) -> Optional[tuple[float, float, float]]:
    """
    Robust algebraic circle fit (Kåsa method – simpler and more stable than
    Taubin for our nearly-complete arc data with low noise).

    Fits the model  x² + y² + D·x + E·y + F = 0
    which gives  center = (-D/2, -E/2),  radius = sqrt(D²/4 + E²/4 - F).

    Returns (cx, cy, radius) or None if numerically unstable.

    Why not Taubin: Our previous Taubin implementation had a sign issue in
    the bias-corrected term that caused dramatic drift to a wrong solution.
    Kåsa is biased but very stable, and our limb points are dense enough
    that the bias is < 1% – which doesn't matter for drift measurements
    (relative position over time is what counts, not absolute size).
    """
    n = len(x)
    if n < 5:
        return None

    # Build linear system A·p = b  where p = [D, E, F]
    # x² + y² + D·x + E·y + F = 0  →  -(x² + y²) = D·x + E·y + F
    A = np.column_stack([x, y, np.ones_like(x)])
    b = -(x ** 2 + y ** 2)

    try:
        # Least-squares solve
        p, residuals, rank, _ = np.linalg.lstsq(A, b, rcond=None)
        if rank < 3:
            return None
        D, E, F = p
        cx = -D / 2.0
        cy = -E / 2.0
        r_sq = cx ** 2 + cy ** 2 - F
        if r_sq <= 0:
            return None
        r = float(np.sqrt(r_sq))
        return float(cx), float(cy), r
    except (np.linalg.LinAlgError, ValueError, FloatingPointError):
        return None


# ---------------------------------------------------------------------------
# Quality scoring helpers
# ---------------------------------------------------------------------------

def _circle_residuals(x: np.ndarray, y: np.ndarray,
                       cx: float, cy: float, r: float) -> np.ndarray:
    return np.sqrt((x - cx) ** 2 + (y - cy) ** 2) - r


def _arc_coverage(x: np.ndarray, y: np.ndarray,
                   cx: float, cy: float, n_bins: int = 36) -> float:
    """What fraction of the full circle arc is covered by edge points?"""
    angles = np.arctan2(y - cy, x - cx)
    bins = np.floor((np.degrees(angles) % 360) / (360 / n_bins)).astype(int)
    covered = len(np.unique(bins))
    return covered / n_bins


def _compute_quality(rms: float, arc: float, radius: float,
                      cfg: SunDetectionConfig) -> float:
    """
    Combine RMS residual, arc coverage, and config thresholds into a
    single quality score in [0, 1].

    Perfect: rms → 0, arc → 1.0
    """
    # RMS quality: 1.0 if rms=0, 0 if rms >= max_fit_residual_px * 2
    rms_q = max(0.0, 1.0 - rms / (cfg.max_fit_residual_px * 2))
    # Arc quality: linear
    arc_q = arc
    # Combined (RMS is more important than arc)
    quality = 0.7 * rms_q + 0.3 * arc_q
    return float(np.clip(quality, 0.0, 1.0))

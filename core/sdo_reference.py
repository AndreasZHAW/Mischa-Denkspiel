"""
core/sdo_reference.py
=====================
Optional online check of camera rotation using SDO/HMI continuum reference
images.  SDO HMI publishes continuum images with sub-arcsecond geometry and
known orientation (solar north up, east left) every 15 minutes.

Workflow:
  1. Download the latest SDO HMI continuum JPEG (or use a cached copy)
  2. Resize / orient it consistent with the user's frame
  3. Cross-correlate the sun-disk interior (where sunspots are) between
     the two images, trying several rotation angles
  4. The rotation angle that maximises the cross-correlation = camera rotation

If anything fails (no internet, no sunspots, low correlation) – return None
silently.  This is an "extra credit" feature, never required.
"""

from __future__ import annotations

import logging
import socket
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class SdoComparisonResult:
    """Outcome of comparing the user's sun image with the SDO reference."""
    success:           bool
    rotation_deg:      float            # camera rotation relative to celestial N
    correlation_peak:  float            # 0..1, how confident
    n_rotations_tested: int
    reference_age_min: float            # how old is the SDO image we used
    message:           str              # human-readable status


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def compare_with_sdo(
    user_image_gray: np.ndarray,
    sun_cx:          float,
    sun_cy:          float,
    sun_radius_px:   float,
    *,
    image_url:       str = "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_2048_HMIIF.jpg",
    target_timestamp: Optional[datetime] = None,
    archive_url_pattern: str = (
        "https://sdo.gsfc.nasa.gov/assets/img/browse/"
        "{YYYY}/{MM}/{DD}/{YYYYMMDD}_{HHMMSS}_2048_HMIIF.jpg"
    ),
    cache_dir:       Optional[Path] = None,
    cache_filename:  str = "sdo_reference.jpg",
    cache_minutes:   int = 15,
    timeout_seconds: float = 10.0,
    angle_step_deg:  float = 1.0,
) -> Optional[SdoComparisonResult]:
    """
    Compare the user's solar image to the SDO HMI continuum image.

    When ``target_timestamp`` is provided, we try to download the SDO image
    closest in time to that timestamp from the SDO browse archive.  This is
    essential when analysing recorded data later in the day or for replay,
    because the latest live image will show a different sunspot configuration
    than what the user actually photographed.

    If the archive download fails, we fall back to the "latest" image.
    If both fail, we use any stale cached copy.

    Returns:
        SdoComparisonResult, or None if no reference is available at all.
        On success, ``rotation_deg`` is the angle from sensor X axis to
        celestial east (CCW positive).
    """
    # --- 1. Get SDO reference image (download or cache) ---
    sdo_path, ref_dt = _fetch_sdo_image(
        latest_url=image_url,
        archive_pattern=archive_url_pattern,
        target_timestamp=target_timestamp,
        cache_dir=cache_dir,
        cache_filename=cache_filename,
        cache_minutes=cache_minutes,
        timeout_seconds=timeout_seconds,
    )
    if sdo_path is None:
        logger.info("SDO reference: no image available (offline + no cache).")
        return None

    # Age of the file we use, relative to target_timestamp (or now)
    if ref_dt is not None and target_timestamp is not None:
        # Strip tzinfo from both ends so subtraction always works regardless
        # of whether either side is timezone-aware or naive.
        def _to_naive(dt: datetime) -> datetime:
            if dt.tzinfo is not None:
                from datetime import timezone as _tz
                return dt.astimezone(_tz.utc).replace(tzinfo=None)
            return dt
        age_sec = abs((_to_naive(target_timestamp) - _to_naive(ref_dt)).total_seconds())
    else:
        age_sec = max((datetime.now().timestamp() - sdo_path.stat().st_mtime), 0)
    age_min = age_sec / 60.0

    # --- 2. Load and prepare SDO image ---
    sdo_full = cv2.imread(str(sdo_path), cv2.IMREAD_GRAYSCALE)
    if sdo_full is None:
        logger.warning("SDO reference: file at %s could not be read.", sdo_path)
        return None

    # SDO image: full sun fills most of the 2048x2048 frame.
    # Find its disk in the same way we'd find the user's disk.
    sdo_cx, sdo_cy, sdo_r = _find_disk_in_sdo(sdo_full)
    if sdo_r is None or sdo_r < 20:
        return SdoComparisonResult(
            success=False, rotation_deg=0.0, correlation_peak=0.0,
            n_rotations_tested=0, reference_age_min=age_min,
            message="Could not find solar disk in SDO image.",
        )

    # --- 3. Extract sun-interior templates from both images ---
    # Use only the inner 80 % to avoid limb-darkening edge effects
    inner_frac = 0.80

    user_patch = _extract_disk_patch(
        user_image_gray, sun_cx, sun_cy, sun_radius_px, inner_frac,
    )
    sdo_patch = _extract_disk_patch(
        sdo_full.astype(np.float32) / 255.0, sdo_cx, sdo_cy, sdo_r, inner_frac,
    )
    if user_patch is None or sdo_patch is None:
        return SdoComparisonResult(
            success=False, rotation_deg=0.0, correlation_peak=0.0,
            n_rotations_tested=0, reference_age_min=age_min,
            message="Could not extract solar interior patch.",
        )

    # Resize SDO patch to match user patch size (so radii are equal)
    sdo_patch_resized = cv2.resize(sdo_patch, user_patch.shape[::-1])

    # --- 4. Try several rotations, find the one with best correlation ---
    # Two-stage search: coarse (5°) over full ±180°, then fine (0.2°) around the peak.
    # This finds the global maximum reliably even when there's a secondary peak
    # (e.g. at the 180°-offset for mirrored images).
    def _scan_angles(angles):
        best_a, best_c = 0.0, -1.0
        for ang in angles:
            M = cv2.getRotationMatrix2D(centre, ang, 1.0)
            rotated = cv2.warpAffine(
                sdo_feat_base, M, (w, h),
                flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT,
            ) * user_mask
            prod  = (user_feat * rotated).sum()
            denom = np.sqrt((user_feat ** 2).sum() * (rotated ** 2).sum())
            corr  = float(prod / denom) if denom > 1e-9 else 0.0
            if corr > best_c:
                best_c = corr; best_a = float(ang)
        return best_a, best_c

    user_mask = _circular_mask(user_patch.shape, inner_frac)
    user_feat = _feature_image(user_patch, user_mask)
    h, w = user_patch.shape
    centre = (w / 2.0, h / 2.0)
    sdo_feat_base = _feature_image(sdo_patch_resized, user_mask)

    # Stage 1: coarse 5° steps
    coarse_angles = np.arange(-180.0, 180.0, 5.0)
    best_angle, best_corr = _scan_angles(coarse_angles)

    # Stage 2: fine 0.2° steps in ±8° window around the coarse peak
    fine_angles = np.arange(best_angle - 8.0, best_angle + 8.0, 0.2)
    best_angle, best_corr = _scan_angles(fine_angles)

    # Count total angles tested across both stages
    n_angles_tested = len(coarse_angles) + len(fine_angles)

    # Interpretation: if rotating SDO by +θ matches user image, then user image
    # is rotated by -θ relative to SDO's frame (where east is on the left side).
    # SDO image: solar east is on the left → we need to flip sign convention.
    # The "camera rotation" for SDAA is the angle from sensor +X to celestial east, CCW+.
    # In SDO standard orientation: east is at angle 180° from +X (pointing left).
    # If we rotated SDO by best_angle to match user, then in user's frame east is
    # at angle (180° - best_angle) from +X.
    camera_rotation_deg = (180.0 - best_angle + 180.0) % 360.0 - 180.0

    success = best_corr > 0.15
    if not success:
        msg = f"Low correlation ({best_corr:.2f}) – sunspots may be too few or atmosphere too poor."
    else:
        msg = (f"OK – best correlation {best_corr:.2f} at rotation "
               f"{camera_rotation_deg:+.1f}°  (SDO image {age_min:.0f} min old)")

    return SdoComparisonResult(
        success           = success,
        rotation_deg      = camera_rotation_deg,
        correlation_peak  = best_corr,
        n_rotations_tested = n_angles_tested,
        reference_age_min = age_min,
        message           = msg,
    )


# ---------------------------------------------------------------------------
# Network helpers
# ---------------------------------------------------------------------------

def _fetch_sdo_image(
    *,
    latest_url: str,
    archive_pattern: str,
    target_timestamp: Optional[datetime],
    cache_dir: Optional[Path],
    cache_filename: str,
    cache_minutes: int,
    timeout_seconds: float,
) -> tuple[Optional[Path], Optional[datetime]]:
    """Download an SDO image and return (path, image_datetime_utc).

    Strategy (in order):
      1. If target_timestamp is given: Helioviewer.org API (finds closest match
         automatically – very reliable for historical dates).
      2. Direct SDO archive URLs (15-minute slots).
      3. SDO "latest" image (only if no target_timestamp).
      4. Any cached copy as last resort.
    """
    if cache_dir is None:
        cache_dir = Path.home() / "sdaa_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    headers = {"User-Agent": "SDAA/1.0 (solar drift analyzer)"}

    # ------- 1. Helioviewer.org (preferred for historical dates) -------
    if target_timestamp is not None:
        if target_timestamp.tzinfo is not None:
            t_utc = target_timestamp.astimezone(timezone.utc).replace(tzinfo=None)
        else:
            t_utc = target_timestamp

        hv_iso = t_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
        # imageScale 4.84 ≈ 1024×1024 image of full solar disk
        # layers: [observatory, instrument, detector, measurement, visible, opacity]
        # HMI continuum gives sunspots clearly
        hv_url = (
            "https://api.helioviewer.org/v2/takeScreenshot/"
            f"?date={hv_iso}"
            "&imageScale=4.84"
            "&layers=%5BSDO,HMI,HMI,continuum,1,100%5D"
            "&x0=0&y0=0&width=1024&height=1024"
            "&display=true&watermark=false"
        )
        hv_cache = cache_dir / (
            f"sdo_archive_{t_utc.year:04d}{t_utc.month:02d}{t_utc.day:02d}_"
            f"{t_utc.hour:02d}{t_utc.minute:02d}_helioviewer.png"
        )
        if hv_cache.exists() and hv_cache.stat().st_size > 1000:
            logger.info("SDO reference: using cached Helioviewer image (%s)",
                        t_utc.isoformat())
            try:
                (cache_dir / cache_filename).write_bytes(hv_cache.read_bytes())
            except OSError:
                pass
            return hv_cache, t_utc
        try:
            req = urllib.request.Request(hv_url, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
                data = resp.read()
            if len(data) >= 1000:
                hv_cache.write_bytes(data)
                (cache_dir / cache_filename).write_bytes(data)
                logger.info(
                    "SDO reference: downloaded %d bytes from Helioviewer for %s",
                    len(data), t_utc.isoformat(),
                )
                return hv_cache, t_utc
            else:
                logger.debug("Helioviewer returned tiny response (%d bytes)", len(data))
        except (urllib.error.URLError, socket.timeout, OSError) as e:
            logger.debug("Helioviewer fetch failed: %s", e)

    # ------- 2. Direct SDO archive URLs (legacy fallback) -------
    if target_timestamp is not None:
        # t_utc was already computed above for the Helioviewer attempt
        for ts in _candidate_archive_times(t_utc):
            url = archive_pattern.format(
                YYYY=f"{ts.year:04d}",
                MM=f"{ts.month:02d}",
                DD=f"{ts.day:02d}",
                YYYYMMDD=f"{ts.year:04d}{ts.month:02d}{ts.day:02d}",
                HHMMSS=f"{ts.hour:02d}{ts.minute:02d}{ts.second:02d}",
            )
            cache_path = cache_dir / (
                f"sdo_archive_{ts.year:04d}{ts.month:02d}{ts.day:02d}_"
                f"{ts.hour:02d}{ts.minute:02d}{ts.second:02d}.jpg"
            )
            # Use cached archive file if it exists (archive contents don't change)
            if cache_path.exists() and cache_path.stat().st_size > 1000:
                logger.info("SDO reference: using cached archive image (%s)",
                            ts.isoformat())
                # Sync canonical filename for the UI
                try:
                    (cache_dir / cache_filename).write_bytes(cache_path.read_bytes())
                except OSError:
                    pass
                return cache_path, ts
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
                    data = resp.read()
                if len(data) < 1000:
                    continue  # Probably a 404 HTML page
                cache_path.write_bytes(data)
                # Also update the canonical "latest" cache so the UI shows it
                (cache_dir / cache_filename).write_bytes(data)
                logger.info(
                    "SDO reference: downloaded %d bytes from archive at %s",
                    len(data), ts.isoformat(),
                )
                return cache_path, ts
            except (urllib.error.URLError, socket.timeout, OSError) as e:
                logger.debug("SDO archive %s failed: %s", ts.isoformat(), e)
                continue

        logger.info("SDO reference: no archive image found near %s.",
                    t_utc.isoformat())

    # ------- 2. Fall back to "latest" image -------
    cache_path = cache_dir / cache_filename
    if cache_path.exists() and target_timestamp is None:
        age_sec = datetime.now().timestamp() - cache_path.stat().st_mtime
        if age_sec < cache_minutes * 60.0:
            logger.debug("SDO reference: using cached latest (age %.0fs)", age_sec)
            return cache_path, None
    try:
        req = urllib.request.Request(latest_url, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
            data = resp.read()
        cache_path.write_bytes(data)
        logger.info("SDO reference: downloaded %d bytes (latest)", len(data))
        return cache_path, None
    except (urllib.error.URLError, socket.timeout, OSError) as e:
        logger.info("SDO reference: latest download failed (%s).", e)
        if cache_path.exists():
            logger.info("SDO reference: using stale cache.")
            return cache_path, None
        return None, None


def _candidate_archive_times(t: datetime) -> list[datetime]:
    """Generate timestamps to try on the SDO archive.

    HMI Continuum browse images are at 15-minute cadence on second 00.
    We try the nearest :00, :15, :30, :45 snap, then progressively wider
    offsets (±15, ±30, ±45, ±60 min) until something works.
    """
    from datetime import timedelta
    minute = t.minute
    nearest = round(minute / 15) * 15
    if nearest == 60:
        base = t.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    else:
        base = t.replace(minute=nearest, second=0, microsecond=0)
    offsets_min = [0, -15, 15, -30, 30, -45, 45, -60, 60]
    return [base + timedelta(minutes=m) for m in offsets_min]


# ---------------------------------------------------------------------------
# Image processing helpers
# ---------------------------------------------------------------------------

def _find_disk_in_sdo(sdo_gray: np.ndarray) -> tuple[float, float, Optional[float]]:
    """Find the solar disk centre in an SDO image. Returns (cx, cy, r)."""
    # SDO HMI continuum: disk is very bright, background is black
    _, mask = cv2.threshold(sdo_gray, 30, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        return 0.0, 0.0, None
    # Largest contour is the sun
    largest = max(contours, key=cv2.contourArea)
    (cx, cy), r = cv2.minEnclosingCircle(largest)
    return float(cx), float(cy), float(r)


def _extract_disk_patch(
    img: np.ndarray, cx: float, cy: float, r: float, inner_frac: float = 0.80,
) -> Optional[np.ndarray]:
    """Extract a square patch covering the inner portion of the solar disk."""
    side = int(2 * r * inner_frac)
    x0 = int(cx - side / 2)
    y0 = int(cy - side / 2)
    if x0 < 0 or y0 < 0 or x0 + side > img.shape[1] or y0 + side > img.shape[0]:
        return None
    return img[y0:y0 + side, x0:x0 + side].astype(np.float32)


def _circular_mask(shape: tuple[int, int], inner_frac: float = 0.80) -> np.ndarray:
    """Disk-shaped mask filling the patch."""
    h, w = shape
    yy, xx = np.ogrid[:h, :w]
    cy, cx = h / 2.0, w / 2.0
    r = min(h, w) / 2.0 * 0.95
    return ((xx - cx) ** 2 + (yy - cy) ** 2 < r * r).astype(np.float32)


def _normalize_masked(img: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Subtract masked-region mean to enable proper cross-correlation."""
    masked_mean = (img * mask).sum() / max(mask.sum(), 1.0)
    return (img - masked_mean) * mask


def _feature_image(img: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Convert an intensity image into a feature image dominated by
    high-frequency structure (sunspots, faculae) so cross-correlation is
    robust against intensity profile differences between the user's
    camera and the SDO HMI continuum.

    Steps:
      1. Subtract a heavily blurred version (high-pass, removes limb darkening
         and any global brightness gradient).
      2. Take absolute value (we don't care if a feature is darker or brighter
         than the background, just that it's a feature).
      3. Apply the disk mask and mean-subtract within the mask.
    """
    # Normalise to [0, 1] for stability
    img = img.astype(np.float32)
    lo, hi = float(img.min()), float(img.max())
    if hi - lo < 1e-6:
        return np.zeros_like(img)
    img = (img - lo) / (hi - lo)

    # High-pass via subtraction of a large blur
    blur_sigma = max(int(min(img.shape) * 0.08), 3)
    blurred = cv2.GaussianBlur(img, (0, 0), blur_sigma)
    hp = np.abs(img - blurred)

    # Apply mask + mean-subtract
    feat = hp * mask
    masked_mean = feat.sum() / max(mask.sum(), 1.0)
    return (feat - masked_mean) * mask

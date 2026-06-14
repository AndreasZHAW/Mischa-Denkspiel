"""
tests/test_sun_detection.py
============================
Unit tests for sun detection using synthetic images from the simulator.
Run with: pytest tests/test_sun_detection.py -v
"""
import numpy as np
import pytest
from pathlib import Path
import tempfile


def make_synthetic_gray(cx: float, cy: float, r: float,
                         h: int = 400, w: int = 600) -> np.ndarray:
    """Create a simple synthetic grayscale solar disk image."""
    yy, xx = np.ogrid[:h, :w]
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    img = np.where(dist < r, 0.9, 0.02).astype(np.float32)
    # Add slight limb darkening
    inside = dist < r
    mu = np.where(inside, np.sqrt(np.clip(1 - (dist / r) ** 2, 0, 1)), 0.0)
    img = np.where(inside, 0.4 + 0.5 * mu, 0.02).astype(np.float32)
    return img


def make_frame(cx: float, cy: float, r: float) -> "PreprocessedFrame":
    from core.preprocessing import PreprocessedFrame
    from core.image_loader import LoadedImage, ImageMetadata
    from datetime import datetime, timezone
    gray = make_synthetic_gray(cx, cy, r)
    display = np.zeros((*gray.shape, 3), dtype=np.uint8)
    meta = ImageMetadata(timestamp=datetime.now(tz=timezone.utc))
    img = LoadedImage(data=gray, metadata=meta, is_color=False)
    return PreprocessedFrame(gray=gray, display=display, source=img)


@pytest.fixture
def sun_cfg():
    from config.config_manager import SunDetectionConfig
    return SunDetectionConfig(
        gaussian_blur_sigma=1.0, bilateral_d=0,
        canny_low_threshold=20, canny_high_threshold=60,
        hough_dp=1.2, hough_min_dist_frac=0.5,
        hough_param1=40, hough_param2=20,
        min_radius_frac=0.05, max_radius_frac=0.90,
        limb_edge_percentile=85, max_fit_residual_px=5.0,
        quality_threshold=0.30,
    )


def test_detect_sun_centre(sun_cfg):
    from core.sun_detection import detect_sun
    true_cx, true_cy, true_r = 300.0, 200.0, 120.0
    frame = make_frame(true_cx, true_cy, true_r)
    result = detect_sun(frame, sun_cfg)
    assert result.success, f"Detection failed: {result.message}"
    assert abs(result.cx - true_cx) < 5.0, f"cx error: {result.cx:.1f} vs {true_cx}"
    assert abs(result.cy - true_cy) < 5.0, f"cy error: {result.cy:.1f} vs {true_cy}"


def test_detect_sun_radius(sun_cfg):
    from core.sun_detection import detect_sun
    frame = make_frame(300.0, 200.0, 100.0)
    result = detect_sun(frame, sun_cfg)
    assert result.success
    assert abs(result.radius - 100.0) < 10.0, f"radius error: {result.radius:.1f}"


def test_quality_score_range(sun_cfg):
    from core.sun_detection import detect_sun
    frame = make_frame(300.0, 200.0, 120.0)
    result = detect_sun(frame, sun_cfg)
    assert 0.0 <= result.quality <= 1.0


def test_empty_image_fails(sun_cfg):
    from core.sun_detection import detect_sun
    from core.preprocessing import PreprocessedFrame
    from core.image_loader import LoadedImage, ImageMetadata
    from datetime import datetime, timezone
    gray = np.zeros((400, 600), dtype=np.float32)
    display = np.zeros((400, 600, 3), dtype=np.uint8)
    meta = ImageMetadata(timestamp=datetime.now(tz=timezone.utc))
    img = LoadedImage(data=gray, metadata=meta, is_color=False)
    frame = PreprocessedFrame(gray=gray, display=display, source=img)
    result = detect_sun(frame, sun_cfg)
    assert not result.success


def test_taubin_fit_accuracy(sun_cfg):
    """Taubin fit should give sub-pixel accuracy on clean data."""
    from core.sun_detection import detect_sun
    true_cx, true_cy, true_r = 299.7, 200.3, 115.5  # non-integer
    frame = make_frame(true_cx, true_cy, true_r)
    result = detect_sun(frame, sun_cfg)
    if result.success:
        assert abs(result.cx - true_cx) < 2.0, f"Sub-pixel cx failed: {result.cx:.3f}"
        assert abs(result.cy - true_cy) < 2.0, f"Sub-pixel cy failed: {result.cy:.3f}"

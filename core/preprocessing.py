"""
core/preprocessing.py
======================
Image preprocessing pipeline: converts a LoadedImage into a float32
grayscale array suitable for sun detection, and optionally produces a
stretch-enhanced BGR array for GUI display.

Pipeline:
  1. Convert colour → grayscale (luminance-weighted)
  2. Bilateral filter (noise reduction while preserving limb edge)
  3. Optional: histogram stretch for display

Each step is a pure function for easy unit-testing and hot-swapping.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np

from config.config_manager import SunDetectionConfig
from core.image_loader import LoadedImage

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class PreprocessedFrame:
    """
    Outputs of the preprocessing step.

    ``gray``   – float32 [0,1] grayscale,  shape (H, W)
    ``display``– uint8   [0,255] BGR,       shape (H, W, 3)  for GUI
    ``source`` – original LoadedImage
    """
    gray:    np.ndarray
    display: np.ndarray
    source:  LoadedImage


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def preprocess(image: LoadedImage, cfg: SunDetectionConfig) -> PreprocessedFrame:
    """Run the full preprocessing pipeline.

    Args:
        image: A ``LoadedImage`` from the image loader.
        cfg:   Sun-detection config (provides filter parameters).

    Returns:
        ``PreprocessedFrame`` ready for the sun detector.
    """
    data = image.data  # float32, BGR or mono

    # 1. Convert to float32 grayscale [0, 1]
    gray = _to_gray(data, image.is_color)

    # 2. Bilateral filter (reduces seeing noise, preserves the limb edge)
    if cfg.bilateral_d > 0:
        # cv2.bilateralFilter requires float32 in [0,1] or uint8
        gray_u8 = (gray * 255).astype(np.uint8)
        gray_u8 = cv2.bilateralFilter(
            gray_u8,
            d=cfg.bilateral_d,
            sigmaColor=cfg.bilateral_sigma_color,
            sigmaSpace=cfg.bilateral_sigma_space,
        )
        gray = gray_u8.astype(np.float32) / 255.0

    # 3. Gaussian blur (seeing smoothing)
    if cfg.gaussian_blur_sigma > 0:
        ksize = _sigma_to_ksize(cfg.gaussian_blur_sigma)
        gray = cv2.GaussianBlur(gray, (ksize, ksize), cfg.gaussian_blur_sigma)

    # 4. Build display image (stretch + convert to uint8 BGR)
    display = _make_display(data, image.is_color)

    return PreprocessedFrame(gray=gray, display=display, source=image)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _to_gray(data: np.ndarray, is_color: bool) -> np.ndarray:
    """Convert float32 BGR or mono to float32 grayscale."""
    if not is_color or data.ndim == 2:
        return data.squeeze().astype(np.float32)
    # BGR → Gray using OpenCV's luminance weights
    gray_u16 = cv2.cvtColor(
        (data * 65535).astype(np.uint16),
        cv2.COLOR_BGR2GRAY,
    )
    return gray_u16.astype(np.float32) / 65535.0


def _make_display(data: np.ndarray, is_color: bool, stretch: str = "auto") -> np.ndarray:
    """
    Produce a display-ready uint8 BGR image.

    stretch options:
      "auto"   – stretch to full [0, 255] range
      "linear" – linear from data min/max
      "log"    – logarithmic stretch (good for sun corona)
      "sqrt"   – square-root stretch
    """
    if data.ndim == 2:
        # Mono → pseudo-colour via orange-tinted LUT (looks solar)
        stretched = _stretch_single(data, stretch)
        bgr_u8 = cv2.applyColorMap(stretched, cv2.COLORMAP_HOT)
    else:
        # Already BGR
        if stretch == "auto":
            norm = _auto_stretch_color(data)
        else:
            norm = data.copy()
        bgr_u8 = np.clip(norm * 255, 0, 255).astype(np.uint8)

    return bgr_u8


def _stretch_single(gray: np.ndarray, mode: str) -> np.ndarray:
    """Stretch float32 [0,1] to uint8 [0,255]."""
    mn, mx = gray.min(), gray.max()
    if mx == mn:
        return np.zeros_like(gray, dtype=np.uint8)

    if mode == "log":
        normed = np.log1p(gray - mn) / np.log1p(mx - mn)
    elif mode == "sqrt":
        normed = np.sqrt((gray - mn) / (mx - mn))
    else:  # auto / linear
        normed = (gray - mn) / (mx - mn)

    return np.clip(normed * 255, 0, 255).astype(np.uint8)


def _auto_stretch_color(data: np.ndarray) -> np.ndarray:
    """Per-channel auto-stretch for BGR float32."""
    out = np.empty_like(data)
    for c in range(data.shape[2]):
        ch = data[:, :, c]
        mn, mx = np.percentile(ch, 1), np.percentile(ch, 99)
        if mx > mn:
            out[:, :, c] = np.clip((ch - mn) / (mx - mn), 0, 1)
        else:
            out[:, :, c] = ch
    return out


def _sigma_to_ksize(sigma: float) -> int:
    """Convert Gaussian sigma to odd kernel size (minimum 3)."""
    k = int(2 * np.ceil(2 * sigma) + 1)
    return max(k, 3) | 1  # ensure odd

"""
core/image_loader.py
====================
Loads FITS, TIF, and SER image files and returns a unified ``LoadedImage``
dataclass.

Responsibilities:
- Read raw pixel data into a float32 numpy array (0.0 – 1.0 range).
- Detect and apply Bayer demosaicing for colour cameras.
- Extract timestamp (DATE-OBS from FITS header, mtime fallback for TIF).
- Extract as much metadata as possible (exposure, gain, focal length, …).
- SER support = Post-Processing mode only (full file already on disk).

Extension points:
- New formats: subclass ``BaseFormatLoader`` and register in ``_FORMAT_REGISTRY``.
"""

from __future__ import annotations

import logging
import re
import struct
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# OpenCV Bayer codes for demosaicing
_BAYER_CV_MAP = {
    "RGGB": cv2.COLOR_BAYER_RGGB2BGR,
    "BGGR": cv2.COLOR_BAYER_BGGR2BGR,
    "GRBG": cv2.COLOR_BAYER_GRBG2BGR,
    "GBRG": cv2.COLOR_BAYER_GBRG2BGR,
}

# FireCapture timestamp in filename: ..._YYYYMMDD_HHMMSS[_NNN].*
_FC_TIMESTAMP_RE = re.compile(r"(\d{8})_(\d{6})")


# ---------------------------------------------------------------------------
# Unified result dataclass
# ---------------------------------------------------------------------------

@dataclass
class ImageMetadata:
    """Everything we know about an image beyond the pixels."""
    timestamp:      Optional[datetime] = None
    exposure_sec:   Optional[float]    = None
    gain_adu:       Optional[float]    = None
    focal_length_mm: Optional[float]   = None
    filter_name:    Optional[str]      = None
    telescope:      Optional[str]      = None
    camera:         Optional[str]      = None
    bayer_pattern:  Optional[str]      = None   # 'RGGB', 'BGGR', …
    bit_depth:      int                = 16
    source_file:    Optional[Path]     = None
    # Observer location (if FITS header includes it - NINA usually does)
    observer_lat_deg:  Optional[float] = None
    observer_lon_deg:  Optional[float] = None
    observer_alt_m:    Optional[float] = None
    # Pier side from mount: "WEST", "EAST", or None
    # Changes between frames = meridian flip occurred
    pier_side:         Optional[str]   = None
    raw_header:     dict               = field(default_factory=dict)


@dataclass
class LoadedImage:
    """
    Pixel data + metadata for one frame.

    ``data`` is always:
    - dtype float32
    - range [0.0, 1.0]
    - shape (H, W, 3) in BGR colour order (OpenCV convention), or (H, W) mono
    """
    data:     np.ndarray
    metadata: ImageMetadata
    is_color: bool = False


# ---------------------------------------------------------------------------
# Abstract base loader (extend for new formats)
# ---------------------------------------------------------------------------

class BaseFormatLoader:
    """Override ``can_load`` and ``load`` to support a new file format."""

    def can_load(self, path: Path) -> bool:
        raise NotImplementedError

    def load(self, path: Path, bayer_fallback: str = "RGGB") -> LoadedImage:
        raise NotImplementedError


# ---------------------------------------------------------------------------
# FITS loader
# ---------------------------------------------------------------------------

class FitsLoader(BaseFormatLoader):
    """Loads FITS / FIT files using astropy.io.fits."""

    def can_load(self, path: Path) -> bool:
        return path.suffix.lower() in {".fits", ".fit"}

    def load(self, path: Path, bayer_fallback: str = "RGGB") -> LoadedImage:
        from astropy.io import fits  # deferred import so non-astropy users get a clear error

        with fits.open(str(path), memmap=False) as hdul:
            # Find the primary image HDU
            hdu = None
            for h in hdul:
                if h.data is not None and h.data.ndim >= 2:
                    hdu = h
                    break
            if hdu is None:
                raise ValueError(f"No image data found in FITS file: {path}")

            raw = hdu.data.astype(np.float32)
            header = dict(hdu.header)

        meta = self._parse_header(header, path, bayer_fallback)
        data, is_color = self._process_raw(raw, meta)
        return LoadedImage(data=data, metadata=meta, is_color=is_color)

    @staticmethod
    def _parse_header(header: dict, path: Path, bayer_fallback: str) -> ImageMetadata:
        meta = ImageMetadata(source_file=path, raw_header=header)

        # Timestamp (prefer DATE-OBS, then DATE-BEG, then filename, then mtime)
        for key in ("DATE-OBS", "DATE-BEG", "DATE"):
            if key in header:
                try:
                    from astropy.time import Time
                    meta.timestamp = Time(header[key]).to_datetime(timezone=timezone.utc)
                    break
                except Exception:
                    pass
        if meta.timestamp is None:
            meta.timestamp = _timestamp_from_filename_or_mtime(path)

        # Bayer pattern
        for key in ("BAYERPAT", "COLORTYP", "BAYOFFX"):
            if key in header and isinstance(header[key], str):
                val = header[key].strip().upper()
                if val in _BAYER_CV_MAP:
                    meta.bayer_pattern = val
                    break
        if meta.bayer_pattern is None:
            # Check NAXIS3: if present and ==3, it's already a colour cube
            if header.get("NAXIS3") == 3:
                meta.bayer_pattern = None  # already demosaiced
            else:
                meta.bayer_pattern = bayer_fallback

        # Misc
        meta.exposure_sec    = header.get("EXPTIME") or header.get("EXPOSURE")
        meta.gain_adu        = header.get("GAIN")
        meta.focal_length_mm = header.get("FOCALLEN")
        meta.filter_name     = header.get("FILTER")
        meta.telescope       = header.get("TELESCOP")
        meta.camera          = header.get("INSTRUME")

        # Observer location from header if present
        # NINA writes SITELAT/SITELONG; SharpCap writes OBSLAT/OBSLONG; some
        # software uses OBSGEO-* (with hyphen, dash escaping in FITS).
        for k_lat in ("SITELAT", "OBSLAT", "OBSGEO-L", "LATITUDE", "LAT"):
            v = header.get(k_lat)
            if v is not None:
                try:
                    meta.observer_lat_deg = float(v)
                    break
                except (ValueError, TypeError):
                    pass
        for k_lon in ("SITELONG", "OBSLONG", "OBSGEO-B", "LONGITUD", "LONGITUDE", "LON"):
            v = header.get(k_lon)
            if v is not None:
                try:
                    meta.observer_lon_deg = float(v)
                    break
                except (ValueError, TypeError):
                    pass
        for k_alt in ("SITEELEV", "OBSALT", "OBSGEO-H", "ELEVATIO", "ALTITUDE", "ELEV"):
            v = header.get(k_alt)
            if v is not None:
                try:
                    meta.observer_alt_m = float(v)
                    break
                except (ValueError, TypeError):
                    pass

        # Pier side (for meridian flip detection)
        for k_pier in ("PIERSIDE", "PIER-SIDE", "PIER_SIDE", "SIDE"):
            v = header.get(k_pier)
            if v is not None and isinstance(v, str):
                v_norm = v.strip().upper()
                # Map various representations to WEST/EAST
                if v_norm in ("WEST", "W", "PIERWEST", "0"):
                    meta.pier_side = "WEST"
                    break
                elif v_norm in ("EAST", "E", "PIEREAST", "1"):
                    meta.pier_side = "EAST"
                    break

        bitpix = abs(int(header.get("BITPIX", 16)))
        meta.bit_depth = bitpix

        return meta

    @staticmethod
    def _process_raw(raw: np.ndarray, meta: ImageMetadata) -> tuple[np.ndarray, bool]:
        """Normalise + debayer raw data."""
        # If data is a 3-axis cube (already RGB from FITS)
        if raw.ndim == 3:
            if raw.shape[0] == 3:
                # (C, H, W) → (H, W, C)  then normalise
                raw = np.moveaxis(raw, 0, -1)
            # Normalise
            norm = _normalise(raw)
            # Convert RGB → BGR (OpenCV convention)
            bgr = norm[:, :, ::-1].copy()
            return bgr, True

        # 2-D (mono or raw Bayer)
        norm = _normalise(raw)

        if meta.bayer_pattern and meta.bayer_pattern in _BAYER_CV_MAP:
            # Convert to uint16 for cv2.demosaicing, then back to float32
            u16 = (norm * 65535).astype(np.uint16)
            bgr_u16 = cv2.cvtColor(u16, _BAYER_CV_MAP[meta.bayer_pattern])
            bgr = bgr_u16.astype(np.float32) / 65535.0
            return bgr, True

        # Pure mono
        return norm, False


# ---------------------------------------------------------------------------
# TIF loader
# ---------------------------------------------------------------------------

class TifLoader(BaseFormatLoader):
    """Loads TIFF files using OpenCV (supports 8/16-bit, mono/colour)."""

    def can_load(self, path: Path) -> bool:
        return path.suffix.lower() in {".tif", ".tiff"}

    def load(self, path: Path, bayer_fallback: str = "RGGB") -> LoadedImage:
        # IMREAD_UNCHANGED preserves 16-bit depth
        raw = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
        if raw is None:
            raise IOError(f"OpenCV could not read TIFF: {path}")

        meta = ImageMetadata(source_file=path)
        meta.timestamp = _timestamp_from_filename_or_mtime(path)

        is_color = raw.ndim == 3 and raw.shape[2] == 3

        if raw.ndim == 2 and not is_color:
            # Raw Bayer TIF from FireCapture
            norm = _normalise(raw.astype(np.float32))
            if bayer_fallback in _BAYER_CV_MAP:
                u16 = (norm * 65535).astype(np.uint16)
                bgr_u16 = cv2.cvtColor(u16, _BAYER_CV_MAP[bayer_fallback])
                data = bgr_u16.astype(np.float32) / 65535.0
                meta.bayer_pattern = bayer_fallback
                is_color = True
            else:
                data = norm
        else:
            data = _normalise(raw.astype(np.float32))

        return LoadedImage(data=data, metadata=meta, is_color=is_color)


# ---------------------------------------------------------------------------
# SER loader  (Post-Processing only – file must be complete on disk)
# ---------------------------------------------------------------------------

# SER header layout (178 bytes, little-endian)
_SER_HEADER_FMT = "<14siii4iii"  # partial – enough for our needs
_SER_COLOR_IDS  = {0: "MONO", 8: "BAYER_RGGB", 9: "BAYER_GRBG",
                   10: "BAYER_GBRG", 11: "BAYER_BGGR",
                   16: "RGB", 18: "BGR"}


class SerLoader(BaseFormatLoader):
    """Loads all frames from a completed SER file as a sequence of LoadedImages."""

    def can_load(self, path: Path) -> bool:
        return path.suffix.lower() == ".ser"

    def load(self, path: Path, bayer_fallback: str = "RGGB") -> LoadedImage:
        """Returns the first frame.  Use ``load_all`` for full sequence."""
        frames = self.load_all(path, bayer_fallback, max_frames=1)
        if not frames:
            raise ValueError(f"SER file is empty: {path}")
        return frames[0]

    def load_all(
        self,
        path: Path,
        bayer_fallback: str = "RGGB",
        max_frames: Optional[int] = None,
    ) -> list[LoadedImage]:
        with open(path, "rb") as fh:
            header_raw = fh.read(178)
            if len(header_raw) < 178:
                raise ValueError("SER file too short / corrupt")

            # Parse key fields from SER header
            # FileID(14) LuID(4) ColorID(4) LittleEndian(4)
            # Width(4) Height(4) PixelDepth(4) FrameCount(4)
            # Observer(40) Instrument(40) Telescope(40) DateTime(8) DateTimeUTC(8)
            fid            = header_raw[:14]
            color_id       = struct.unpack_from("<i", header_raw, 18)[0]
            little_endian  = struct.unpack_from("<i", header_raw, 22)[0]
            width          = struct.unpack_from("<i", header_raw, 26)[0]
            height         = struct.unpack_from("<i", header_raw, 30)[0]
            pixel_depth    = struct.unpack_from("<i", header_raw, 34)[0]
            frame_count    = struct.unpack_from("<i", header_raw, 38)[0]

            bytes_per_pixel = (pixel_depth + 7) // 8
            frame_size = width * height * bytes_per_pixel

            color_name = _SER_COLOR_IDS.get(color_id, "MONO")
            dtype = np.uint8 if bytes_per_pixel == 1 else np.uint16

            n = min(frame_count, max_frames) if max_frames else frame_count
            results: list[LoadedImage] = []

            for i in range(n):
                fh.seek(178 + i * frame_size)
                raw_bytes = fh.read(frame_size)
                raw = np.frombuffer(raw_bytes, dtype=dtype).reshape(height, width)

                if not little_endian and dtype == np.uint16:
                    raw = raw.byteswap()

                meta = ImageMetadata(
                    source_file=path,
                    timestamp=_timestamp_from_filename_or_mtime(path),
                    bit_depth=pixel_depth,
                )

                norm = _normalise(raw.astype(np.float32))

                if color_name in ("BAYER_RGGB", "BAYER_GRBG", "BAYER_GBRG", "BAYER_BGGR"):
                    pattern = color_name.replace("BAYER_", "")
                    meta.bayer_pattern = pattern
                    u16 = (norm * 65535).astype(np.uint16)
                    bgr = cv2.cvtColor(u16, _BAYER_CV_MAP[pattern]).astype(np.float32) / 65535.0
                    results.append(LoadedImage(data=bgr, metadata=meta, is_color=True))
                elif color_name == "RGB":
                    raw3 = raw.reshape(height, width, 3)
                    bgr = _normalise(raw3.astype(np.float32))[:, :, ::-1].copy()
                    results.append(LoadedImage(data=bgr, metadata=meta, is_color=True))
                else:
                    results.append(LoadedImage(data=norm, metadata=meta, is_color=False))

        return results


# ---------------------------------------------------------------------------
# Registry and public API
# ---------------------------------------------------------------------------

_FORMAT_REGISTRY: list[BaseFormatLoader] = [
    FitsLoader(),
    TifLoader(),
    SerLoader(),
]


def load_image(path: Path, bayer_fallback: str = "RGGB") -> LoadedImage:
    """Load any supported image file.  Raises ``ValueError`` for unknown formats."""
    for loader in _FORMAT_REGISTRY:
        if loader.can_load(path):
            logger.debug("Loading %s with %s", path.name, type(loader).__name__)
            return loader.load(path, bayer_fallback)
    raise ValueError(
        f"Unsupported file format: {path.suffix!r}  (supported: "
        + ", ".join(SUPPORTED_EXTENSIONS) + ")"
    )


def load_ser_all(path: Path, bayer_fallback: str = "RGGB",
                 max_frames: Optional[int] = None) -> list[LoadedImage]:
    """Load all frames from a SER file (Post-Processing mode)."""
    loader = SerLoader()
    return loader.load_all(path, bayer_fallback, max_frames=max_frames)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalise(data: np.ndarray) -> np.ndarray:
    """Scale any integer/float array to float32 [0, 1]."""
    mn, mx = data.min(), data.max()
    if mx == mn:
        return np.zeros_like(data, dtype=np.float32)
    return ((data - mn) / (mx - mn)).astype(np.float32)


def _timestamp_from_filename_or_mtime(path: Path) -> datetime:
    """Extract timestamp from FireCapture filename pattern or fall back to mtime."""
    m = _FC_TIMESTAMP_RE.search(path.stem)
    if m:
        try:
            dt = datetime.strptime(m.group(1) + m.group(2), "%Y%m%d%H%M%S")
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    # Fallback: file modification time
    mtime = path.stat().st_mtime
    return datetime.fromtimestamp(mtime, tz=timezone.utc)


# Re-export supported extensions for other modules
from core.file_watcher import SUPPORTED_EXTENSIONS

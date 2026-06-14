"""
simulator/synthetic_generator.py
==================================
Generates synthetic FITS frames with a simulated solar disk for testing.

The simulator can reproduce:
  A: Perfect alignment (zero drift, only seeing noise)
  B: Pure azimuth error (linear X drift)
  C: Pure altitude error (linear Y drift)
  D: Combined az + alt error (diagonal drift)
  E: Mid-session mount correction (position jump)
  F: Poor seeing (high position scatter)
  G: Custom drift vector

Usage:
    from simulator.synthetic_generator import Simulator, ScenarioE
    sim = Simulator(width=1936, height=1096, plate_scale=5.06)
    sim.run_scenario(ScenarioB(az_error_arcmin=1.0), output_dir=Path("test_data/scenarioB"))
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import numpy as np


# ---------------------------------------------------------------------------
# Scenario definitions
# ---------------------------------------------------------------------------

@dataclass
class ScenarioBase:
    """Base class for all scenarios."""
    name:            str   = "custom"
    n_frames:        int   = 120         # number of frames
    interval_sec:    float = 15.0        # seconds between frames
    seeing_arcsec:   float = 3.0         # 1-sigma Gaussian seeing noise
    sun_radius_arcsec: float = 960.0     # real solar semi-diameter in arcsec


@dataclass
class ScenarioA(ScenarioBase):
    """Perfect alignment – baseline / ground truth."""
    name: str = "A_perfect"
    az_error_arcmin:  float = 0.0
    alt_error_arcmin: float = 0.0


@dataclass
class ScenarioB(ScenarioBase):
    """Pure azimuth error."""
    name: str = "B_azimuth_error"
    az_error_arcmin:  float = 1.0   # arcmin polar axis azimuth error
    alt_error_arcmin: float = 0.0


@dataclass
class ScenarioC(ScenarioBase):
    """Pure altitude error."""
    name: str = "C_altitude_error"
    az_error_arcmin:  float = 0.0
    alt_error_arcmin: float = 0.8


@dataclass
class ScenarioD(ScenarioBase):
    """Combined az + alt error."""
    name: str = "D_combined"
    az_error_arcmin:  float = 0.7
    alt_error_arcmin: float = 0.5


@dataclass
class ScenarioE(ScenarioBase):
    """Mid-session mount correction (position jump at frame 60)."""
    name:             str   = "E_correction"
    az_error_arcmin:  float = 1.2
    alt_error_arcmin: float = 0.4
    correction_at_frame: int = 60  # correction applied here
    correction_az_arcmin:  float = 1.2
    correction_alt_arcmin: float = 0.4


@dataclass
class ScenarioF(ScenarioBase):
    """Poor seeing – tests robustness of limb fitting."""
    name:           str   = "F_poor_seeing"
    az_error_arcmin: float = 0.5
    alt_error_arcmin: float = 0.3
    seeing_arcsec:   float = 15.0   # much worse seeing


@dataclass
class ScenarioG(ScenarioBase):
    """Custom drift – specify rate directly in arcsec/min."""
    name: str = "G_custom"
    ra_drift_arcsec_min:  float = 10.0
    dec_drift_arcsec_min: float = 5.0


# ---------------------------------------------------------------------------
# Simulator
# ---------------------------------------------------------------------------

class Simulator:
    """
    Generates synthetic FITS frames.

    Args:
        width, height:    sensor size in pixels
        plate_scale:      arcsec per pixel
        camera_rotation:  degrees CCW from pixel-X to East
    """

    def __init__(
        self,
        width:            int   = 1936,
        height:           int   = 1096,
        plate_scale:      float = 5.06,   # arcsec/px for FMA180 + 4.4µm pixel
        camera_rotation:  float = 15.0,   # typical camera rotation
    ) -> None:
        self.width  = width
        self.height = height
        self.ps     = plate_scale
        self.theta  = math.radians(camera_rotation)
        self._rng   = np.random.default_rng(seed=42)

    # ------------------------------------------------------------------ public

    def run_scenario(
        self,
        scenario,
        output_dir: Path,
        start_time: Optional[datetime] = None,
        verbose: bool = True,
    ) -> list[Path]:
        """
        Generate all frames for a scenario and save as FITS.

        Returns list of generated file paths.
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        if start_time is None:
            start_time = datetime.now(tz=timezone.utc).replace(
                hour=10, minute=0, second=0, microsecond=0
            )

        paths = []
        for i in range(scenario.n_frames):
            t = start_time + timedelta(seconds=i * scenario.interval_sec)
            cx, cy = self._compute_position(scenario, i, t)
            frame = self._render_frame(cx, cy, scenario)
            path = output_dir / f"sdaa_sim_{scenario.name}_{i:04d}.fits"
            self._save_fits(frame, path, t, cx_true=cx, cy_true=cy)
            paths.append(path)
            if verbose and i % 20 == 0:
                print(f"  Generated {i+1}/{scenario.n_frames}: "
                      f"cx={cx:.1f} cy={cy:.1f}")

        if verbose:
            print(f"Scenario {scenario.name}: {len(paths)} frames → {output_dir}")
        return paths

    def generate_all_scenarios(
        self,
        base_dir: Path = Path("test_data"),
        verbose: bool = True,
    ) -> dict[str, list[Path]]:
        """Generate all standard scenarios."""
        scenarios = [
            ScenarioA(),
            ScenarioB(az_error_arcmin=1.0),
            ScenarioB(name="B_large", az_error_arcmin=2.5),
            ScenarioC(alt_error_arcmin=0.8),
            ScenarioD(),
            ScenarioE(),
            ScenarioF(),
        ]
        results = {}
        for s in scenarios:
            paths = self.run_scenario(s, base_dir / s.name, verbose=verbose)
            results[s.name] = paths
        return results

    # ----------------------------------------------------------------- private

    def _compute_position(self, scenario, frame_idx: int, t: datetime) -> tuple[float, float]:
        """Compute sun centre (cx, cy) in pixels for this frame."""
        # Start near image centre
        cx0 = self.width  / 2.0
        cy0 = self.height / 2.0

        dt_min = frame_idx * scenario.interval_sec / 60.0   # minutes elapsed

        # Compute drift rate in pixels/minute from polar error
        # Use simplified relationship: drift ∝ error (ignores H, δ dependence)
        if hasattr(scenario, "ra_drift_arcsec_min"):
            # Custom scenario: direct drift
            dx_arcsec_min = scenario.ra_drift_arcsec_min
            dy_arcsec_min = scenario.dec_drift_arcsec_min
        else:
            az  = getattr(scenario, "az_error_arcmin",  0.0) * 60.0  # to arcsec
            alt = getattr(scenario, "alt_error_arcmin", 0.0) * 60.0  # to arcsec
            # Approximate: az error mainly drives RA drift, alt mainly Dec
            # Coefficients based on typical solar position (H~3h, δ~+15°)
            # These are simplified – the real solver uses exact geometry
            dx_arcsec_min = az  * 0.8    # arcsec/min per arcsec of az error
            dy_arcsec_min = alt * 1.2

        # Handle scenario E correction
        if hasattr(scenario, "correction_at_frame") and frame_idx >= scenario.correction_at_frame:
            dx_arcsec_min -= scenario.correction_az_arcmin  * 60.0 * 0.8
            dy_arcsec_min -= scenario.correction_alt_arcmin * 60.0 * 1.2

        # Convert arcsec/min to pixels/min
        dx_px_min = dx_arcsec_min / self.ps
        dy_px_min = dy_arcsec_min / self.ps

        # Rotate from sky frame to pixel frame
        theta = self.theta
        dx_px =  dx_px_min * math.cos(theta) - dy_px_min * math.sin(theta)
        dy_px =  dx_px_min * math.sin(theta) + dy_px_min * math.cos(theta)

        # Seeing noise (Gaussian, σ in arcsec)
        sigma_px = scenario.seeing_arcsec / self.ps
        noise_x  = float(self._rng.normal(0, sigma_px))
        noise_y  = float(self._rng.normal(0, sigma_px))

        cx = cx0 + dx_px * dt_min + noise_x
        cy = cy0 + dy_px * dt_min + noise_y
        return cx, cy

    def _render_frame(
        self,
        cx: float,
        cy: float,
        scenario,
        add_limb_darkening: bool = True,
    ) -> np.ndarray:
        """
        Render a synthetic solar disk image as uint16 numpy array.

        The image simulates:
        - Solar disk with limb darkening
        - Gaussian seeing blur
        - Shot noise
        - Background sky
        """
        img = np.zeros((self.height, self.width), dtype=np.float32)

        # Sun radius in pixels
        r_px = scenario.sun_radius_arcsec / self.ps

        # Build coordinate grid
        yy, xx = np.ogrid[:self.height, :self.width]
        dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        inside = dist < r_px

        if add_limb_darkening:
            # Eddington limb darkening: I(μ) = I₀(0.4 + 0.6·μ)  where μ = cos(θ) = sqrt(1-(r/R)²)
            mu = np.where(inside, np.sqrt(np.clip(1 - (dist / r_px) ** 2, 0, 1)), 0.0)
            intensity = np.where(inside, 0.4 + 0.6 * mu, 0.0)
        else:
            intensity = np.where(inside, 1.0, 0.0).astype(np.float32)

        img += intensity.astype(np.float32)

        # Seeing blur (Gaussian PSF)
        seeing_sigma_px = scenario.seeing_arcsec / self.ps / 2.35  # FWHM → sigma
        if seeing_sigma_px > 0.3:
            import cv2
            k = max(3, int(2 * 3 * seeing_sigma_px + 1) | 1)
            img = cv2.GaussianBlur(img, (k, k), seeing_sigma_px)

        # Background + shot noise
        background = 0.02
        img += background
        # Poisson-like noise
        max_counts = 50000
        img_counts = (img * max_counts).astype(np.float32)
        noise = self._rng.normal(0, np.sqrt(np.maximum(img_counts, 1))).astype(np.float32)
        img_noisy = np.clip(img_counts + noise, 0, 65535).astype(np.uint16)

        return img_noisy

    @staticmethod
    def _save_fits(
        data: np.ndarray,
        path: Path,
        timestamp: datetime,
        cx_true: float = 0.0,
        cy_true: float = 0.0,
    ) -> None:
        """Save frame as FITS with full header."""
        from astropy.io import fits
        from astropy.time import Time

        hdr = fits.Header()
        hdr["SIMPLE"]   = True
        hdr["BITPIX"]   = 16
        hdr["NAXIS"]    = 2
        hdr["NAXIS1"]   = data.shape[1]
        hdr["NAXIS2"]   = data.shape[0]
        hdr["DATE-OBS"] = Time(timestamp).fits
        hdr["INSTRUME"] = "SDAA_SIMULATOR"
        hdr["TELESCOP"] = "Synthetic"
        hdr["EXPTIME"]  = 0.001
        hdr["GAIN"]     = 1.0
        hdr["BAYERPAT"] = ""         # mono (no Bayer)
        hdr["SDAA_CX"]  = (cx_true, "True sun centre X (simulator)")
        hdr["SDAA_CY"]  = (cy_true, "True sun centre Y (simulator)")
        hdr["COMMENT"]  = "Generated by SDAA Simulator"

        hdu = fits.PrimaryHDU(data=data.astype(np.int16), header=hdr)
        hdu.writeto(str(path), overwrite=True)

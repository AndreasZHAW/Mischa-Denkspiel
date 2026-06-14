"""
tests/test_image_loader.py
============================
Integration tests for the image loader using simulator-generated FITS files.
"""
import numpy as np
import pytest
import tempfile
from pathlib import Path


@pytest.fixture(scope="module")
def sample_fits(tmp_path_factory):
    """Generate one synthetic FITS file for testing."""
    tmp = tmp_path_factory.mktemp("fits")
    from simulator.synthetic_generator import Simulator, ScenarioA
    sim = Simulator(width=640, height=480, plate_scale=5.06)
    s = ScenarioA(n_frames=1)
    paths = sim.run_scenario(s, tmp / "scenarioA", verbose=False)
    return paths[0]


def test_fits_loads_successfully(sample_fits):
    from core.image_loader import load_image
    img = load_image(sample_fits)
    assert img.data is not None
    assert img.data.dtype == np.float32
    assert img.data.min() >= 0.0
    assert img.data.max() <= 1.0 + 1e-5


def test_fits_has_timestamp(sample_fits):
    from core.image_loader import load_image
    from datetime import datetime
    img = load_image(sample_fits)
    assert img.metadata.timestamp is not None
    assert isinstance(img.metadata.timestamp, datetime)


def test_fits_dimensions(sample_fits):
    from core.image_loader import load_image
    img = load_image(sample_fits)
    assert img.data.shape[0] == 480  # height
    assert img.data.shape[1] == 640  # width


def test_preprocess_returns_float32(sample_fits):
    from core.image_loader import load_image
    from core.preprocessing import preprocess
    from config.config_manager import SunDetectionConfig
    img = load_image(sample_fits)
    cfg = SunDetectionConfig(bilateral_d=0, gaussian_blur_sigma=1.0)
    frame = preprocess(img, cfg)
    assert frame.gray.dtype == np.float32
    assert frame.gray.ndim == 2
    assert frame.display.dtype == np.uint8


def test_unsupported_format_raises():
    from core.image_loader import load_image
    with pytest.raises(ValueError, match="Unsupported"):
        load_image(Path("test.xyz"))

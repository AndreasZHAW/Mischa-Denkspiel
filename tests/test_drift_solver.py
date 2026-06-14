"""
tests/test_drift_solver.py
============================
Unit tests for the weighted linear regression drift solver.
"""
import numpy as np
import pytest
from datetime import datetime, timedelta, timezone


def make_points(
    n: int = 30,
    drift_x_px_min: float = 2.0,
    drift_y_px_min: float = -1.0,
    noise_sigma: float = 0.5,
    quality: float = 1.0,
    interval_sec: float = 15.0,
):
    from core.tracking_engine import TrackPoint, PointStatus
    t0 = datetime(2026, 5, 26, 10, 0, 0, tzinfo=timezone.utc)
    rng = np.random.default_rng(42)
    points = []
    cx0, cy0 = 968.0, 548.0
    for i in range(n):
        t = t0 + timedelta(seconds=i * interval_sec)
        dt_min = i * interval_sec / 60.0
        cx = cx0 + drift_x_px_min * dt_min + rng.normal(0, noise_sigma)
        cy = cy0 + drift_y_px_min * dt_min + rng.normal(0, noise_sigma)
        points.append(TrackPoint(
            timestamp=t, cx_px=cx, cy_px=cy,
            quality=quality, rms_px=0.5, frame_idx=i,
        ))
    return points


@pytest.fixture
def solver():
    from config.config_manager import DriftConfig
    from core.drift_solver import DriftSolver
    cfg = DriftConfig(min_frames_for_solution=5, outlier_sigma=3.0,
                      max_drift_arcsec_min=600)
    return DriftSolver(cfg, plate_scale_arcsec_px=5.06, camera_rotation_deg=0.0)


def test_solve_known_drift(solver):
    points = make_points(n=30, drift_x_px_min=2.0, drift_y_px_min=-1.0, noise_sigma=0.2)
    sol = solver.solve(points)
    assert sol.solution_valid
    assert abs(sol.drift_x_px_min - 2.0) < 0.2, f"X drift: {sol.drift_x_px_min:.3f}"
    assert abs(sol.drift_y_px_min - (-1.0)) < 0.2, f"Y drift: {sol.drift_y_px_min:.3f}"


def test_arcsec_conversion(solver):
    """Pixel drift × plate scale = arcsec drift."""
    points = make_points(n=30, drift_x_px_min=1.0, drift_y_px_min=0.0, noise_sigma=0.1)
    sol = solver.solve(points)
    expected_ra = 1.0 * 5.06  # px/min × arcsec/px
    assert abs(sol.drift_ra_arcsec_min - expected_ra) < 0.5


def test_insufficient_frames(solver):
    points = make_points(n=3)  # less than min_frames=5
    sol = solver.solve(points)
    assert not sol.solution_valid


def test_weighted_regression_ignores_low_quality():
    """Low-quality (q≈0) points should not dominate the fit."""
    from config.config_manager import DriftConfig
    from core.drift_solver import DriftSolver
    cfg = DriftConfig(min_frames_for_solution=5)
    solver = DriftSolver(cfg, plate_scale_arcsec_px=5.06)

    good = make_points(n=20, drift_x_px_min=2.0, noise_sigma=0.1, quality=1.0)
    bad = make_points(n=5, drift_x_px_min=50.0, noise_sigma=0.1, quality=0.01)
    all_pts = good + bad

    sol = solver.solve(all_pts)
    assert sol.solution_valid
    assert abs(sol.drift_x_px_min - 2.0) < 1.0, f"Low-quality not ignored: {sol.drift_x_px_min}"


def test_r_squared_good_fit(solver):
    points = make_points(n=60, noise_sigma=0.1)
    sol = solver.solve(points)
    assert sol.r_squared_x > 0.95, f"R² too low: {sol.r_squared_x:.3f}"

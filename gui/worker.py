"""
gui/worker.py
=============
QThread worker that runs the entire processing pipeline:
  FileWatcher → ImageLoader → Preprocessor → SunDetector → TrackingEngine
                    → DriftSolver → PolarAlignmentSolver

Emits Qt signals so the GUI can update safely in the main thread.
"""

from __future__ import annotations

import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import numpy as np
from PyQt6.QtCore import QThread, pyqtSignal

from config.config_manager import ConfigManager
from core.file_watcher import FileWatcher
from core.image_loader import load_image
from core.preprocessing import preprocess
from core.sun_detection import detect_sun, SunDetectionResult
from core.tracking_engine import TrackingEngine, TrackPoint, PointStatus
from core.drift_solver import DriftSolver, DriftSolution
from core.polar_alignment_solver import (
    PolarAlignmentSolver, PolarError, attach_screw_instructions,
)
from core.coordinate_transform import PixelSkyTransform
from core.refraction import compute_refraction, sun_altitude
from core.sunspot_tracker import SunspotTracker
from session.session_manager import SessionManager
from session.session_model import SessionSetup, SessionTrackPoint

logger = logging.getLogger(__name__)


class ProcessingWorker(QThread):
    """
    Runs in a background thread.  All results are emitted as Qt signals.
    """

    # Emits (TrackPoint, display_image_ndarray)
    new_frame       = pyqtSignal(object, object)
    drift_updated   = pyqtSignal(object)
    polar_updated   = pyqtSignal(object)
    # Emitted whenever the set of tracking points changes; carries the full list
    tracking_updated = pyqtSignal(object)
    # Emitted after each sunspot-correlation measurement: (frame_idx, ts, dx, dy, ok)
    sunspot_updated = pyqtSignal(object)
    # Emitted once the background SDO comparison has finished (success or not)
    sdo_result      = pyqtSignal(object)
    auto_reset_detected = pyqtSignal()
    error_occurred  = pyqtSignal(str)
    status_message  = pyqtSignal(str)

    def __init__(
        self,
        config_manager: ConfigManager,
        replay_path: Optional[Path] = None,
    ) -> None:
        super().__init__()
        self._cm          = config_manager
        self._cfg         = config_manager.config
        self._replay_path = replay_path
        self._running     = False
        self._n_frames    = 0
        self._reset_requested = False
        self._fits_observer_logged = False
        self._current_pier_side: Optional[str] = None     # tracks WEST/EAST across frames
        self._pier_flip_rotation_offset_deg: float = 0.0  # 180° added after a flip

        # Pipeline components
        self._watcher     : Optional[FileWatcher]          = None
        self._tracker     : Optional[TrackingEngine]        = None
        self._drift_solver: Optional[DriftSolver]           = None
        self._polar_solver: Optional[PolarAlignmentSolver]  = None
        self._transform   : Optional[PixelSkyTransform]     = None
        self._session_mgr : Optional[SessionManager]        = None
        # Parallel sunspot-correlation tracker (initialised on first frame)
        self._sunspot_tracker = SunspotTracker()
        # Whether we've already kicked off the (optional) SDO comparison
        self._sdo_check_done = False

    # ------------------------------------------------------------------ public

    @property
    def n_frames(self) -> int:
        return self._n_frames

    @property
    def queue_length(self) -> int:
        return self._watcher.pending_count if self._watcher else 0

    def stop(self) -> None:
        self._running = False
        if self._watcher:
            self._watcher.stop()

    def reset_drift(self) -> None:
        self._reset_requested = True

    def save_session(self) -> None:
        if self._session_mgr and self._session_mgr.current:
            try:
                path = self._session_mgr.save(
                    config_path=self._cm.config_path
                )
                self.status_message.emit(f"Session saved: {path.name}")
            except Exception as e:
                self.error_occurred.emit(f"Save failed: {e}")

    def load_session(self, path: Path) -> None:
        """Load a session for post-processing (called from main thread)."""
        if self._session_mgr:
            try:
                self._session_mgr.load(path)
                self.status_message.emit(f"Session loaded: {path.name}")
            except Exception as e:
                self.error_occurred.emit(f"Load failed: {e}")

    # ------------------------------------------------------------------ thread

    def run(self) -> None:
        self._running = True
        cfg = self._cfg

        # Initialise pipeline components
        ps = cfg.plate_scale_arcsec_px
        rot = cfg.calibration.camera_rotation_deg

        self._tracker      = TrackingEngine(cfg.drift)
        self._tracker.set_plate_scale_hint(ps)
        self._tracker.on_auto_reset = lambda: self.auto_reset_detected.emit()

        self._drift_solver = DriftSolver(cfg.drift, ps, rot)
        self._polar_solver = PolarAlignmentSolver(cfg.observer)
        self._transform    = PixelSkyTransform(ps, rot)

        self._session_mgr  = SessionManager(Path(cfg.paths.sessions_folder))
        setup = SessionSetup(
            camera_model          = cfg.camera.model,
            pixel_size_um          = cfg.camera.pixel_size_um,
            focal_length_mm        = cfg.optics.focal_length_mm,
            reducer_factor         = cfg.optics.reducer_factor,
            plate_scale_arcsec_px  = ps,
            mount_model            = cfg.mount.model,
            tracking_rate          = cfg.mount.tracking_rate,
            observer_lat           = cfg.observer.latitude_deg,
            observer_lon           = cfg.observer.longitude_deg,
            observer_alt_m         = cfg.observer.altitude_m,
            camera_rotation_deg    = rot,
        )
        from version import VERSION
        setup.sdaa_version = VERSION
        self._session_mgr.new_session(setup)

        # Start file watcher
        watch_path = Path(cfg.paths.watch_folder)
        processed_path = Path(cfg.paths.processed_folder)

        # Safety: processed folder must NOT be inside watch folder, otherwise
        # the recursive watcher would re-detect files we just moved → infinite loop
        try:
            processed_path.resolve().relative_to(watch_path.resolve())
            # If we get here, processed is inside watch → fix it
            safe_processed = watch_path.parent / (watch_path.name + "_processed")
            self.error_occurred.emit(
                f"⚠ Processed folder was inside watch folder (would cause loop). "
                f"Using {safe_processed} instead."
            )
            processed_path = safe_processed
        except (ValueError, OSError):
            pass  # processed is outside watch → all good

        self._watcher = FileWatcher(watch_path)
        self._watcher.start()

        self.status_message.emit(f"Watching: {watch_path}")
        logger.info("Processing worker started.  plate_scale=%.3f arcsec/px", ps)

        # Main processing loop
        while self._running:
            # Handle manual reset
            if self._reset_requested:
                self._reset_requested = False
                if self._tracker:
                    self._tracker.reset(keep_history=False)   # clear ALL points
                self._sunspot_tracker.reset()
                if self._polar_solver:
                    self._polar_solver.reset_cache()           # forget cached good solve
                self._n_frames = 0                             # reset frame counter
                # Tell the UI to clear the plot and frame counter
                self.tracking_updated.emit([])
                self.status_message.emit("Drift reset.")
                logger.info("Drift reset (full)")

            path = self._watcher.get_next(timeout=0.2)
            if path is None:
                continue

            try:
                self._process_file(path, processed_path)
            except Exception as e:
                logger.exception("Error processing %s", path.name)
                self.error_occurred.emit(f"{path.name}: {e}")
            finally:
                self._watcher.task_done()

    def _process_file(self, path: Path, processed_path: Path) -> None:
        """Full pipeline for one image file."""
        cfg = self._cfg
        self._n_frames += 1

        # 1. Load image — with retry, because the capture software (SharpCap)
        #    may still be writing/holding the file when the watcher fires.
        import time
        image = None
        last_err = None
        for attempt in range(5):
            try:
                image = load_image(path, bayer_fallback=cfg.camera.bayer_pattern_fallback)
                break
            except (PermissionError, OSError) as e:
                last_err = e
                time.sleep(0.3 * (attempt + 1))   # 0.3, 0.6, 0.9, 1.2 s backoff
        if image is None:
            logger.warning(
                "Frame %d: could not read %s after retries (%s). Skipping.",
                self._n_frames, path.name, last_err,
            )
            self.status_message.emit(
                f"⚠ Frame {self._n_frames}: file locked, skipped ({path.name})"
            )
            self._n_frames -= 1   # don't count a frame we couldn't read
            return

        # 1b. Meridian flip detection (PIERSIDE from FITS header)
        # If the user set a manual override (SharpCap doesn't write PIERSIDE),
        # use that instead of the header value.
        override = (cfg.mount_adjust.pier_side_override or "AUTO").upper()
        if override in ("WEST", "EAST"):
            new_pier = override
        else:
            new_pier = image.metadata.pier_side
        if new_pier is not None:
            if self._current_pier_side is None:
                # First frame with pier info – just remember
                self._current_pier_side = new_pier
                logger.info("Initial pier side: %s", new_pier)
            elif new_pier != self._current_pier_side:
                # Meridian flip!
                old_pier = self._current_pier_side
                self._current_pier_side = new_pier
                self._pier_flip_rotation_offset_deg = (
                    self._pier_flip_rotation_offset_deg + 180.0
                ) % 360.0
                logger.warning(
                    "MERIDIAN FLIP detected: %s → %s.  "
                    "Drift reset; camera rotation offset now +%.0f°",
                    old_pier, new_pier, self._pier_flip_rotation_offset_deg,
                )
                self.status_message.emit(
                    f"⚠ Meridian flip detected ({old_pier} → {new_pier}). "
                    "Drift curve reset."
                )
                # Reset tracking engine and rebuild solver with new rotation
                if self._tracker:
                    self._tracker.reset(keep_history=True)
                self._sunspot_tracker.reset()   # template is now upside-down
                effective_rot = (cfg.calibration.camera_rotation_deg
                                 + self._pier_flip_rotation_offset_deg)
                self._drift_solver = DriftSolver(
                    cfg.drift, cfg.plate_scale_arcsec_px, effective_rot,
                )
                self._transform = PixelSkyTransform(
                    cfg.plate_scale_arcsec_px, effective_rot,
                )

        # 2. Preprocess
        frame = preprocess(image, cfg.detection.sun)

        # 3. Detect sun
        result = detect_sun(frame, cfg.detection.sun)
        if not result.success:
            logger.warning("Frame %d: sun not detected – %s", self._n_frames, result.message)
            self.status_message.emit(f"⚠ Frame {self._n_frames}: {result.message}")
            self._move_to_processed(path, processed_path)
            return

        # 4. Build TrackPoint
        ts = image.metadata.timestamp or datetime.now(tz=timezone.utc)
        status = (PointStatus.LOW_QUALITY
                  if result.quality < cfg.detection.sun.quality_threshold
                  else PointStatus.OK)

        img_h, img_w = frame.gray.shape[:2]
        tp = TrackPoint(
            timestamp    = ts,
            cx_px        = result.cx,
            cy_px        = result.cy,
            quality      = result.quality,
            rms_px       = result.rms_residual_px,
            frame_idx    = self._n_frames,
            radius_px    = result.radius,
            source_file  = str(path),
            status       = status,
            image_w      = int(img_w),
            image_h      = int(img_h),
        )

        # 4b. Sunspot template-matching (independent verification)
        # Uses the limb-fit centre as a search hint.  The plot panel uses the
        # limb position to reject outliers (sunspot shouldn't disagree with
        # limb by more than a few pixels under normal conditions).
        try:
            ss = self._sunspot_tracker.process(
                frame.gray, result.cx, result.cy, result.radius,
            )
            self.sunspot_updated.emit({
                "frame_idx":  self._n_frames,
                "timestamp":  ts,
                "cx_px":      ss.cx_px,
                "cy_px":      ss.cy_px,
                # Limb-fit position used as outlier-rejection reference
                "limb_cx":    result.cx,
                "limb_cy":    result.cy,
                "response":   ss.response,
                "success":    ss.success,
            })
        except Exception as e:
            logger.debug("Sunspot tracker error on frame %d: %s",
                         self._n_frames, e)

        # 4c. Kick off the SDO online comparison once, in the background.
        # We do this on the FIRST successful detection so we know where the
        # sun is and have a real image to compare.
        if (not self._sdo_check_done
                and cfg.sdo_ref.enabled
                and self._n_frames == 1):
            self._sdo_check_done = True
            self._start_sdo_comparison_async(
                frame.gray.copy(), result.cx, result.cy, result.radius,
                obs_time=ts,
            )

        # 5. Add to tracking engine
        assert self._tracker is not None
        self._tracker.add_point(tp)

        # 6. Refraction check + use FITS observer coords if present (NINA writes them)
        if (image.metadata.observer_lat_deg is not None
                and image.metadata.observer_lon_deg is not None
                and not self._fits_observer_logged):
            self._fits_observer_logged = True
            logger.info("Using observer coords from FITS header: lat=%.4f lon=%.4f",
                        image.metadata.observer_lat_deg,
                        image.metadata.observer_lon_deg)
            # Override config values (one-time per session)
            cfg.observer.latitude_deg  = image.metadata.observer_lat_deg
            cfg.observer.longitude_deg = image.metadata.observer_lon_deg
            if image.metadata.observer_alt_m is not None:
                cfg.observer.altitude_m = image.metadata.observer_alt_m
            self.status_message.emit(
                f"Using observer coords from FITS: "
                f"{cfg.observer.latitude_deg:.3f}°N, {cfg.observer.longitude_deg:.3f}°E"
            )

        try:
            alt = sun_altitude(ts, cfg.observer)
            ref_info = compute_refraction(alt, cfg.refraction)
            if ref_info.warn:
                self.status_message.emit(ref_info.warn_message)
        except Exception as e:
            logger.debug("Refraction check skipped: %s", e)

        # 7. Compute drift
        active = self._tracker.active_points()
        assert self._drift_solver is not None
        drift = self._drift_solver.solve(active)

        # 8. Compute polar error + attach screw-turn instructions
        # IMPORTANT: use the MIDPOINT timestamp of the active session, not the
        # latest frame.  The matrix coefficients depend on HA, and as HA
        # changes during the session, the matrix can become singular at
        # certain HA values, producing absurd polar errors.  Using the
        # midpoint:
        #   * Gives a fixed geometry that doesn't change with each frame.
        #   * Approximates the average over the session.
        #   * Avoids re-crossing singular HA values from frame to frame.
        assert self._polar_solver is not None
        if len(active) >= 2:
            mid_idx = len(active) // 2
            polar_ts = active[mid_idx].timestamp
        else:
            polar_ts = ts

        # When the camera image is mirrored, pixel axes are inverted, which
        # means the derived Dec and/or RA drift rates have the wrong sign.
        # Negate selectively so the polar solver gets physically correct rates.
        # The two flags can be set independently (e.g. camera rotated 90°).
        drift_for_polar = drift
        inv_az  = cfg.mount_adjust.invert_az_direction  or cfg.mount_adjust.invert_correction_directions
        inv_alt = cfg.mount_adjust.invert_alt_direction or cfg.mount_adjust.invert_correction_directions

        # If the current pier side differs from the side the invert flags were
        # calibrated for, the image is rotated 180° (meridian-flip geometry),
        # so BOTH axis inversions toggle.  This makes the corrections come out
        # right regardless of which side of the meridian the data was taken on.
        ref_side = (cfg.mount_adjust.invert_reference_pier_side or "WEST").upper()
        cur_side = (self._current_pier_side or ref_side).upper()
        if cur_side and cur_side != ref_side:
            inv_az  = not inv_az
            inv_alt = not inv_alt
            logger.debug(
                "Pier side %s differs from reference %s → toggling invert flags "
                "(az=%s, alt=%s)", cur_side, ref_side, inv_az, inv_alt,
            )

        if drift.solution_valid and (inv_az or inv_alt):
            from core.drift_solver import DriftSolution as _DS
            # Az error is driven by RA drift; Alt error by Dec drift.
            new_ra  = -drift.drift_ra_arcsec_min  if inv_az  else drift.drift_ra_arcsec_min
            new_dec = -drift.drift_dec_arcsec_min if inv_alt else drift.drift_dec_arcsec_min
            drift_for_polar = _DS(
                drift_x_px_min       = drift.drift_x_px_min,
                drift_y_px_min       = drift.drift_y_px_min,
                drift_ra_arcsec_min  = new_ra,
                drift_dec_arcsec_min = new_dec,
                sigma_ra_arcsec_min  = drift.sigma_ra_arcsec_min,
                sigma_dec_arcsec_min = drift.sigma_dec_arcsec_min,
                n_points             = drift.n_points,
                r_squared_x          = drift.r_squared_x,
                r_squared_y          = drift.r_squared_y,
                solution_valid       = drift.solution_valid,
                message              = drift.message,
            )

        polar = self._polar_solver.solve(drift_for_polar, obs_time=polar_ts)
        polar = attach_screw_instructions(
            polar,
            az_arcmin_per_turn            = cfg.mount_adjust.az_arcmin_per_turn,
            alt_arcmin_per_turn           = cfg.mount_adjust.alt_arcmin_per_turn,
            az_right_screw_direction      = cfg.mount_adjust.az_right_screw_direction,
            invert_correction_directions  = False,  # already applied above via drift negation
        )

        # 9. Save to session
        self._save_point_to_session(tp, drift, polar)

        # 10. Emit results to GUI (display image with overlaid circle + arrow)
        drift_vec = None
        if cfg.gui.show_drift_arrow and drift.solution_valid:
            # Pixel-space drift direction (per minute).  Positive y = downward.
            drift_vec = (drift.drift_x_px_min, drift.drift_y_px_min)
        display = self._make_display(frame.display, result, drift_vec)
        self.new_frame.emit(tp, display)
        self.drift_updated.emit(drift)
        self.polar_updated.emit(polar)
        # Full point list for the scatter plot
        self.tracking_updated.emit(self._tracker.all_points())

        # 11. Move file to processed folder
        self._move_to_processed(path, processed_path)

        if self._n_frames % 10 == 0:
            self.save_session()  # auto-save every 10 frames

    # ------------------------------------------------------------------ SDO async

    def _start_sdo_comparison_async(
        self,
        gray_image: np.ndarray,
        cx: float, cy: float, radius_px: float,
        obs_time: Optional[datetime] = None,
    ) -> None:
        """Run the SDO reference comparison in a daemon thread so the main
        processing pipeline isn't blocked by the network call.

        ``obs_time`` is the observation timestamp of the FIRST frame.  This
        is passed to the comparison so we can fetch a SDO image from the
        archive that matches when the data was actually taken — essential
        when analysing recorded data after the fact, since the latest live
        image will show a completely different sunspot configuration.

        Reports back via the ``sdo_result`` signal regardless of outcome.
        Silent on failure (just logged at DEBUG)."""
        import threading
        from pathlib import Path as _Path
        cfg = self._cfg

        def _run():
            try:
                from core.sdo_reference import compare_with_sdo, SdoComparisonResult
                cache_dir = _Path.home() / "sdaa_cache"
                cache_dir.mkdir(parents=True, exist_ok=True)
                cache_jpg = cache_dir / "sdo_reference.jpg"
                if obs_time is not None:
                    logger.info(
                        "Trying SDO reference comparison (target time %s, "
                        "cache dir %s)…",
                        obs_time.isoformat(timespec="seconds"),
                        cache_dir,
                    )
                else:
                    logger.info("Trying SDO reference comparison (latest)…")

                result = None
                try:
                    result = compare_with_sdo(
                        user_image_gray=gray_image,
                        sun_cx=cx, sun_cy=cy, sun_radius_px=radius_px,
                        image_url       = cfg.sdo_ref.image_url,
                        target_timestamp= obs_time,
                        cache_dir       = cache_dir,
                        cache_minutes   = cfg.sdo_ref.cache_minutes,
                        timeout_seconds = cfg.sdo_ref.timeout_seconds,
                    )
                except Exception as e:
                    logger.warning(
                        "SDO comparison raised an exception (%s) — "
                        "showing image only.", e, exc_info=True,
                    )
                    result = None

                # Even if compare_with_sdo returned None, check whether we
                # successfully downloaded an image (visible in cache).
                if result is None:
                    # cache_jpg was set above; check whether anything is there
                    files_in_cache = list(cache_dir.glob("sdo_*"))
                    if cache_jpg.exists() and cache_jpg.stat().st_size > 1000:
                        # We have an image but no analysis — synthesize a
                        # "partial" result so the UI at least shows the image.
                        result = SdoComparisonResult(
                            success=False,
                            rotation_deg=0.0,
                            correlation_peak=0.0,
                            n_rotations_tested=0,
                            reference_age_min=0,
                            message="Image loaded; rotation analysis unavailable.",
                        )
                        logger.info("SDO image present, but analysis failed — "
                                    "displaying image only.")
                    else:
                        logger.warning(
                            "SDO comparison: no reference image. "
                            "cache_jpg exists=%s (size=%d), "
                            "files in %s: %d (%s). "
                            "Helioviewer fetch may have failed — check "
                            "internet connection or firewall blocks for "
                            "api.helioviewer.org.",
                            cache_jpg.exists(),
                            cache_jpg.stat().st_size if cache_jpg.exists() else 0,
                            cache_dir, len(files_in_cache),
                            ", ".join(f.name for f in files_in_cache[:3]),
                        )
                        self.sdo_result.emit(None)
                        return
                if result.success:
                    logger.info(
                        "SDO comparison: camera rotation = %.1f° relative to "
                        "celestial north (correlation %.2f, ref %d min old).",
                        result.rotation_deg, result.correlation_peak,
                        int(result.reference_age_min),
                    )
                else:
                    logger.info("SDO comparison: %s", result.message)
                self.sdo_result.emit(result)
            except Exception as e:
                logger.warning("SDO worker thread failed: %s", e, exc_info=True)
                # Still tell the UI we tried, so it doesn't get stuck on
                # "not loaded yet" forever.
                try:
                    self.sdo_result.emit(None)
                except Exception:
                    pass

        t = threading.Thread(target=_run, name="SDO-Compare", daemon=True)
        t.start()

    @staticmethod
    def _make_display(bgr: np.ndarray, result: SunDetectionResult,
                      drift_vec: Optional[tuple] = None) -> np.ndarray:
        """Draw sun circle overlay (and optional drift-direction arrow)."""
        import cv2
        import numpy as np
        out = bgr.copy()
        cx, cy, r = int(result.cx), int(result.cy), int(result.radius)
        colour = (0, 220, 80) if result.quality > 0.6 else (0, 140, 255)
        cv2.circle(out, (cx, cy), r, colour, 2)
        cv2.circle(out, (cx, cy), 3, (0, 0, 255), -1)  # centre dot

        # Drift-direction arrow: a thin line from the sun edge to the image
        # border in the direction of travel, ending with an arrowhead.
        if drift_vec is not None:
            dx, dy = drift_vec
            mag = (dx * dx + dy * dy) ** 0.5
            if mag > 1e-6:
                ux, uy = dx / mag, dy / mag      # unit direction
                h, w = out.shape[:2]
                # Start just outside the sun's edge
                start = (cx + ux * (r + 8), cy + uy * (r + 8))
                # Find where the ray hits the image border
                # Solve for the smallest positive t so start + t*u hits an edge
                ts = []
                if ux > 1e-9:   ts.append((w - 1 - start[0]) / ux)
                if ux < -1e-9:  ts.append((0 - start[0]) / ux)
                if uy > 1e-9:   ts.append((h - 1 - start[1]) / uy)
                if uy < -1e-9:  ts.append((0 - start[1]) / uy)
                ts = [t for t in ts if t > 0]
                if ts:
                    t_edge = min(ts)
                    end = (start[0] + ux * t_edge, start[1] + uy * t_edge)
                    p0 = (int(start[0]), int(start[1]))
                    p1 = (int(end[0]),   int(end[1]))
                    # Thin yellow line to the border
                    cv2.line(out, p0, p1, (0, 255, 255), 1, cv2.LINE_AA)
                    # Arrowhead near the border
                    cv2.arrowedLine(out, p0, p1, (0, 255, 255), 2,
                                    cv2.LINE_AA, tipLength=0.03)
        return out

    def _move_to_processed(self, src: Path, dest_dir: Path) -> None:
        """
        Move src into dest_dir, preserving the subfolder hierarchy below the
        watch folder.  When keep_files_in_place is set, do nothing (originals
        stay where they are).

        When moving IS enabled, the whole capture subfolder (e.g. 11_04_37) is
        moved as a unit rather than individual files, matching SharpCap's
        one-folder-per-capture layout.

        Robust against PermissionError (file still locked by the capture app):
        logs a warning and leaves the file in place instead of crashing.
        """
        # Respect the "keep files in place" setting
        if self._cfg.paths.keep_files_in_place:
            return

        try:
            watch_root = Path(self._cfg.paths.watch_folder).resolve()
            src_res = src.resolve()
            rel = src_res.relative_to(watch_root)
            dest = dest_dir / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
        except (ValueError, OSError):
            dest = dest_dir / f"{src.stem}_{src.stat().st_mtime_ns}{src.suffix}"
            dest.parent.mkdir(parents=True, exist_ok=True)

        if dest.exists():
            dest = dest.with_name(f"{dest.stem}_{src.stat().st_mtime_ns}{dest.suffix}")

        try:
            shutil.move(str(src), str(dest))
        except (PermissionError, OSError) as e:
            # File is still locked by the capture software, or read-only.
            # Don't crash the worker — just leave the file and warn once.
            logger.warning(
                "Could not move %s (%s). Leaving file in place. "
                "Tip: enable 'Keep files in place' in Setup → Paths.",
                src.name, e,
            )

    def _save_point_to_session(
        self,
        tp: TrackPoint,
        drift: DriftSolution,
        polar: PolarError,
    ) -> None:
        if not self._session_mgr or not self._session_mgr.current:
            return
        session = self._session_mgr.current
        session.points.append(SessionTrackPoint(
            timestamp_iso = tp.timestamp.isoformat(),
            cx_px         = tp.cx_px,
            cy_px         = tp.cy_px,
            quality       = tp.quality,
            rms_px        = tp.rms_px,
            frame_idx     = tp.frame_idx,
            status        = tp.status.name,
            radius_px     = tp.radius_px,
            source_file   = tp.source_file,
            note          = tp.note,
        ))
        if drift.solution_valid:
            from datetime import timezone
            from session.session_model import SessionDriftSolution, SessionPolarError
            session.drift_solutions.append(SessionDriftSolution(
                drift_ra_arcsec_min  = drift.drift_ra_arcsec_min,
                drift_dec_arcsec_min = drift.drift_dec_arcsec_min,
                sigma_ra_arcsec_min  = drift.sigma_ra_arcsec_min,
                sigma_dec_arcsec_min = drift.sigma_dec_arcsec_min,
                n_points             = drift.n_points,
                r_squared_x          = drift.r_squared_x,
                r_squared_y          = drift.r_squared_y,
                computed_at_iso      = datetime.now(tz=timezone.utc).isoformat(),
            ))
        if polar.solution_valid:
            from session.session_model import SessionPolarError
            session.polar_errors.append(SessionPolarError(
                azimuth_arcmin   = polar.azimuth_arcmin,
                altitude_arcmin  = polar.altitude_arcmin,
                total_arcmin     = polar.total_arcmin,
                az_direction     = polar.az_direction,
                alt_direction    = polar.alt_direction,
                sigma_az_arcmin  = polar.sigma_az_arcmin,
                sigma_alt_arcmin = polar.sigma_alt_arcmin,
                correction_az    = polar.correction_az,
                correction_alt   = polar.correction_alt,
                computed_at_iso  = datetime.now(tz=timezone.utc).isoformat(),
            ))

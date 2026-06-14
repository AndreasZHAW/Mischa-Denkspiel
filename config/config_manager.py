"""
config/config_manager.py
========================
Loads, validates, and saves the SDAA configuration.

Design decisions:
- Single source of truth: default_config.yaml is the template.
- User config lives in the sessions folder (path persisted in a tiny bootstrap file).
- All settings are accessible as typed Python attributes, not dict lookups.
- Adding a new setting = add it to default_config.yaml + (optionally) a dataclass field.
"""

from __future__ import annotations

import copy
import logging
import os
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Optional

import yaml

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path to the shipped default config (inside the package)
# ---------------------------------------------------------------------------
_DEFAULT_CONFIG_PATH = Path(__file__).parent / "default_config.yaml"


def _autodiscover_capture_folder() -> Optional[str]:
    """Try to find a likely solar-capture folder on this machine.

    Searches common SharpCap / NINA / FireCapture locations under the user's
    home directory.  Returns the first existing folder, or None.

    The goal is that on a fresh machine, SDAA points somewhere sensible
    out of the box instead of a hard-coded path from another computer.
    """
    home = Path.home()
    candidates = [
        # User's own naming from screenshots
        home / "Documents" / "Imaging for the Life Sciences" / "SDAA" / "Calibration_Data_Sun",
        home / "Documents" / "SDAA" / "Calibration_Data_Sun",
        # SharpCap defaults (SharpCap usually saves under Pictures!)
        home / "Pictures" / "SharpCap" / "Calibration_Data_Sun",
        home / "Pictures" / "SharpCap Captures",
        home / "Pictures" / "SharpCap",
        home / "Documents" / "SharpCap Captures",
        home / "SharpCap Captures",
        # NINA defaults
        home / "Documents" / "N.I.N.A",
        home / "Documents" / "NINA",
        # FireCapture
        home / "Documents" / "FireCapture",
        home / "FireCapture",
        # Generic
        home / "Pictures" / "AstroCapture",
        home / "Documents" / "AstroCapture",
    ]
    for c in candidates:
        try:
            if c.exists() and c.is_dir():
                logger.info("Auto-discovered capture folder: %s", c)
                return str(c)
        except OSError:
            continue
    return None

# Bootstrap file: tiny file that stores ONLY where the user config lives.
# Lives next to the executable so it survives across reinstalls.
_BOOTSTRAP_FILENAME = "sdaa_config_location.txt"


# ---------------------------------------------------------------------------
# Typed dataclasses – one per top-level YAML section
# ---------------------------------------------------------------------------

@dataclass
class ObserverConfig:
    latitude_deg:  float = 47.3769
    longitude_deg: float =  8.5417
    altitude_m:    float = 408.0
    timezone:      str   = "Europe/Zurich"


@dataclass
class PathsConfig:
    watch_folder:     str = ""
    processed_folder: str = ""
    sessions_folder:  str = ""
    # If True, processed FITS files are LEFT in place (not moved to the
    # processed folder).  Recommended when the capture software (SharpCap)
    # keeps files locked, or when you simply want to keep your originals.
    keep_files_in_place: bool = True


@dataclass
class CameraConfig:
    model:                       str   = "ATR2600C / IMX571"
    pixel_size_um:                float = 3.76
    sensor_width_px:              int   = 6248
    sensor_height_px:             int   = 4176
    is_color:                     bool  = True
    bayer_pattern_fallback:       str   = "RGGB"


@dataclass
class OpticsConfig:
    focal_length_mm:                  float        = 180.0
    reducer_factor:                   float        = 1.0
    plate_scale_override_arcsec_px:   Optional[float] = None

    @property
    def effective_focal_length_mm(self) -> float:
        return self.focal_length_mm * self.reducer_factor


@dataclass
class MountConfig:
    model:         str = "EQ6-R Pro"
    tracking_rate: str = "custom"   # solar | sidereal | lunar | custom (NINA Orbitals)


@dataclass
class SunDetectionConfig:
    gaussian_blur_sigma:   float = 2.0
    bilateral_d:           int   = 9
    bilateral_sigma_color: float = 75.0
    bilateral_sigma_space: float = 75.0
    canny_low_threshold:   int   = 30
    canny_high_threshold:  int   = 100
    hough_dp:              float = 1.2
    hough_min_dist_frac:   float = 0.5
    hough_param1:          float = 60.0
    hough_param2:          float = 30.0
    min_radius_frac:       float = 0.05
    max_radius_frac:       float = 0.90
    limb_edge_percentile:  float = 90.0
    max_fit_residual_px:   float = 3.0
    quality_threshold:     float = 0.15


@dataclass
class DetectionConfig:
    sun: SunDetectionConfig = field(default_factory=SunDetectionConfig)


@dataclass
class DriftConfig:
    min_frames_for_solution:      int   = 5
    outlier_sigma:                float = 3.0
    max_drift_arcsec_min:         float = 600.0
    auto_reset_enabled:           bool  = True
    auto_reset_threshold_arcsec:  float = 300.0
    auto_reset_countdown_sec:     int   = 30


@dataclass
class RefractionConfig:
    enabled:                   bool  = True
    pressure_hPa:              float = 1013.25
    temperature_C:             float = 15.0
    warn_below_altitude_deg:   float = 30.0


@dataclass
class AscomConfig:
    enabled:                bool  = False
    driver:                 str   = "eqmod"
    prog_id:                str   = "EQMOD.Telescope"
    auto_correction:        bool  = False
    correction_cooldown_sec: int  = 30


@dataclass
class MountAdjustmentConfig:
    """How much one full turn of the mount's adjustment screws moves the polar axis."""
    az_arcmin_per_turn:    float = 30.0
    alt_arcmin_per_turn:   float = 30.0
    az_right_screw_direction: str = "east"
    # Inversion flags — set these when suggested corrections appear backwards.
    # Typical cause: camera rotated 180° → both axes inverted.
    # Camera rotated 90° → one axis inverted, one not.
    invert_az_direction:  bool = False   # flip East↔West
    invert_alt_direction: bool = False   # flip Up↔Down
    # The pier side for which the invert flags above were calibrated.
    # On the OPPOSITE pier side, the image is rotated 180° (meridian flip),
    # so both invert flags are automatically toggled.  "WEST" or "EAST".
    invert_reference_pier_side: str = "WEST"
    # Manual pier-side override for capture software that doesn't write a
    # PIERSIDE FITS header (e.g. SharpCap).  "AUTO" = read from header;
    # "WEST"/"EAST" = force that side for the whole session.
    pier_side_override: str = "AUTO"
    # Legacy combined flag (kept for backwards-compat, not shown in UI)
    invert_correction_directions: bool = False


@dataclass
class SdoReferenceConfig:
    """Settings for the optional SDO/HMI reference-image-based rotation check."""
    enabled:           bool = True    # try at startup; silently skip if offline
    image_url:         str  = "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_2048_HMIIF.jpg"
    timeout_seconds:   float = 10.0
    cache_minutes:     int   = 15     # SDO updates every 15 min
    cache_filename:    str   = "sdo_reference.jpg"


@dataclass
class CalibrationConfig:
    camera_rotation_deg: float        = 0.0
    calibration_date:    Optional[str] = None


@dataclass
class GuiConfig:
    theme:                  str = "dark"
    image_stretch:          str = "auto"
    drift_plot_history_min: int = 30
    compass_scale:          str = "arcmin"
    font_size_pt:           int = 10
    show_drift_arrow:       bool = True   # draw drift-direction arrow on live view


@dataclass
class LoggingConfig:
    level:        str = "INFO"
    log_file:     str = "sdaa.log"
    max_bytes:    int = 5_242_880
    backup_count: int = 3


# ---------------------------------------------------------------------------
# Root config object
# ---------------------------------------------------------------------------

@dataclass
class SdaaConfig:
    observer:    ObserverConfig    = field(default_factory=ObserverConfig)
    paths:       PathsConfig       = field(default_factory=PathsConfig)
    camera:      CameraConfig      = field(default_factory=CameraConfig)
    optics:      OpticsConfig      = field(default_factory=OpticsConfig)
    mount:       MountConfig       = field(default_factory=MountConfig)
    detection:   DetectionConfig   = field(default_factory=DetectionConfig)
    drift:       DriftConfig       = field(default_factory=DriftConfig)
    refraction:  RefractionConfig  = field(default_factory=RefractionConfig)
    ascom:       AscomConfig       = field(default_factory=AscomConfig)
    calibration: CalibrationConfig = field(default_factory=CalibrationConfig)
    mount_adjust: MountAdjustmentConfig = field(default_factory=MountAdjustmentConfig)
    sdo_ref:     SdoReferenceConfig = field(default_factory=SdoReferenceConfig)
    gui:         GuiConfig         = field(default_factory=GuiConfig)
    logging:     LoggingConfig     = field(default_factory=LoggingConfig)

    # ---- derived / computed properties --------------------------------

    @property
    def plate_scale_arcsec_px(self) -> float:
        """Arcseconds per pixel.  Uses manual override if set."""
        if self.optics.plate_scale_override_arcsec_px is not None:
            return self.optics.plate_scale_override_arcsec_px
        eff_fl_mm = self.optics.effective_focal_length_mm
        return 206_265.0 * (self.camera.pixel_size_um / 1_000.0) / eff_fl_mm

    @property
    def fov_arcsec(self) -> tuple[float, float]:
        """Field of view (width, height) in arcseconds."""
        ps = self.plate_scale_arcsec_px
        return (ps * self.camera.sensor_width_px,
                ps * self.camera.sensor_height_px)


# ---------------------------------------------------------------------------
# Config manager (load / save / merge)
# ---------------------------------------------------------------------------

class ConfigManager:
    """Load and save the SDAA configuration.

    Usage:
        mgr = ConfigManager()          # loads or creates user config
        cfg = mgr.config               # SdaaConfig dataclass
        cfg.camera.pixel_size_um = 3.8
        mgr.save()
    """

    def __init__(self, config_path: Optional[Path] = None):
        self._config_path: Optional[Path] = config_path
        self._config: SdaaConfig = SdaaConfig()
        self._load()

    # ------------------------------------------------------------------ public

    @property
    def config(self) -> SdaaConfig:
        return self._config

    @property
    def config_path(self) -> Optional[Path]:
        return self._config_path

    def save(self, path: Optional[Path] = None) -> None:
        """Persist config to YAML.  Uses current path if *path* is None."""
        target = path or self._config_path
        if target is None:
            logger.warning("No config path set – cannot save.")
            return
        target.parent.mkdir(parents=True, exist_ok=True)
        data = self._dataclass_to_dict(self._config)
        with open(target, "w", encoding="utf-8") as fh:
            yaml.safe_dump(data, fh, default_flow_style=False, allow_unicode=True,
                           sort_keys=False)
        logger.info("Config saved to %s", target)

    def reload(self) -> None:
        """Re-read config from disk (e.g. after external edit)."""
        self._load()

    # ----------------------------------------------------------------- private

    def _load(self) -> None:
        """Load default config, then overlay user config if it exists."""
        default_data = self._read_yaml(_DEFAULT_CONFIG_PATH)
        if self._config_path and self._config_path.exists():
            user_data = self._read_yaml(self._config_path)
            merged = self._deep_merge(default_data, user_data)
        else:
            merged = default_data
        self._config = self._dict_to_config(merged)
        logger.debug("Config loaded (path=%s)", self._config_path)

    @staticmethod
    def _read_yaml(path: Path) -> dict:
        with open(path, "r", encoding="utf-8") as fh:
            return yaml.safe_load(fh) or {}

    @staticmethod
    def _deep_merge(base: dict, override: dict) -> dict:
        """Recursively merge *override* into *base* (override wins)."""
        result = copy.deepcopy(base)
        for key, val in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(val, dict):
                result[key] = ConfigManager._deep_merge(result[key], val)
            else:
                result[key] = val
        return result

    @staticmethod
    def _dict_to_config(d: dict) -> SdaaConfig:
        """Convert raw dict (from YAML) to typed SdaaConfig."""
        def _get(d, key, default):
            return d.get(key, default)

        obs = d.get("observer", {})
        pth = d.get("paths", {})
        cam = d.get("camera", {})
        opt = d.get("optics", {})
        mnt = d.get("mount", {})
        det = d.get("detection", {})
        sun = det.get("sun", {})
        dri = d.get("drift", {})
        ref = d.get("refraction", {})
        asc = d.get("ascom", {})
        cal = d.get("calibration", {})
        madj = d.get("mount_adjust", {})
        sdo  = d.get("sdo_ref", {})
        gui = d.get("gui", {})
        log = d.get("logging", {})

        cfg = SdaaConfig(
            observer=ObserverConfig(
                latitude_deg  = float(obs.get("latitude_deg",  47.3769)),
                longitude_deg = float(obs.get("longitude_deg",  8.5417)),
                altitude_m    = float(obs.get("altitude_m",   408.0)),
                timezone      = str(obs.get("timezone", "Europe/Zurich")),
            ),
            paths=PathsConfig(
                watch_folder     = str(pth.get("watch_folder")     or _autodiscover_capture_folder()
                                       or str(Path.home() / "Documents" / "SDAA" / "Calibration_Data_Sun")),
                processed_folder = str(pth.get("processed_folder")  or str(Path.home() / "Documents" / "SDAA" / "processed")),
                sessions_folder  = str(pth.get("sessions_folder")   or str(Path.home() / "Documents" / "SDAA" / "sessions")),
                keep_files_in_place = bool(pth.get("keep_files_in_place", True)),
            ),
            camera=CameraConfig(
                model                     = str(cam.get("model", "Unknown")),
                pixel_size_um              = float(cam.get("pixel_size_um", 4.4)),
                sensor_width_px            = int(cam.get("sensor_width_px", 1936)),
                sensor_height_px           = int(cam.get("sensor_height_px", 1096)),
                is_color                   = bool(cam.get("is_color", True)),
                bayer_pattern_fallback     = str(cam.get("bayer_pattern_fallback", "RGGB")),
            ),
            optics=OpticsConfig(
                focal_length_mm                 = float(opt.get("focal_length_mm", 180.0)),
                reducer_factor                  = float(opt.get("reducer_factor", 1.0)),
                plate_scale_override_arcsec_px  = opt.get("plate_scale_override_arcsec_px"),
            ),
            mount=MountConfig(
                model         = str(mnt.get("model", "EQ6")),
                tracking_rate = str(mnt.get("tracking_rate", "solar")),
            ),
            detection=DetectionConfig(
                sun=SunDetectionConfig(
                    gaussian_blur_sigma   = float(sun.get("gaussian_blur_sigma",   2.0)),
                    bilateral_d           = int(sun.get("bilateral_d",           9)),
                    bilateral_sigma_color = float(sun.get("bilateral_sigma_color", 75.0)),
                    bilateral_sigma_space = float(sun.get("bilateral_sigma_space", 75.0)),
                    canny_low_threshold   = int(sun.get("canny_low_threshold",   30)),
                    canny_high_threshold  = int(sun.get("canny_high_threshold",  100)),
                    hough_dp              = float(sun.get("hough_dp",            1.2)),
                    hough_min_dist_frac   = float(sun.get("hough_min_dist_frac", 0.5)),
                    hough_param1          = float(sun.get("hough_param1",        60.0)),
                    hough_param2          = float(sun.get("hough_param2",        30.0)),
                    min_radius_frac       = float(sun.get("min_radius_frac",     0.05)),
                    max_radius_frac       = float(sun.get("max_radius_frac",     0.90)),
                    limb_edge_percentile  = float(sun.get("limb_edge_percentile", 90.0)),
                    max_fit_residual_px   = float(sun.get("max_fit_residual_px",  3.0)),
                    quality_threshold     = float(sun.get("quality_threshold",    0.40)),
                ),
            ),
            drift=DriftConfig(
                min_frames_for_solution     = int(dri.get("min_frames_for_solution",  5)),
                outlier_sigma               = float(dri.get("outlier_sigma",          3.0)),
                max_drift_arcsec_min        = float(dri.get("max_drift_arcsec_min",   600.0)),
                auto_reset_enabled          = bool(dri.get("auto_reset_enabled",      True)),
                auto_reset_threshold_arcsec = float(dri.get("auto_reset_threshold_arcsec", 90.0)),
                auto_reset_countdown_sec    = int(dri.get("auto_reset_countdown_sec", 30)),
            ),
            refraction=RefractionConfig(
                enabled                  = bool(ref.get("enabled",     True)),
                pressure_hPa             = float(ref.get("pressure_hPa",   1013.25)),
                temperature_C            = float(ref.get("temperature_C",  15.0)),
                warn_below_altitude_deg  = float(ref.get("warn_below_altitude_deg", 30.0)),
            ),
            ascom=AscomConfig(
                enabled              = bool(asc.get("enabled",   False)),
                driver               = str(asc.get("driver",    "eqmod")),
                prog_id              = str(asc.get("prog_id",   "EQMOD.Telescope")),
                auto_correction      = bool(asc.get("auto_correction", False)),
                correction_cooldown_sec = int(asc.get("correction_cooldown_sec", 30)),
            ),
            calibration=CalibrationConfig(
                camera_rotation_deg = float(cal.get("camera_rotation_deg", 0.0)),
                calibration_date    = cal.get("calibration_date"),
            ),
            mount_adjust=MountAdjustmentConfig(
                az_arcmin_per_turn            = float(madj.get("az_arcmin_per_turn", 30.0)),
                alt_arcmin_per_turn           = float(madj.get("alt_arcmin_per_turn", 30.0)),
                az_right_screw_direction      = str(madj.get("az_right_screw_direction", "east")),
                invert_az_direction           = bool(madj.get("invert_az_direction", False)),
                invert_alt_direction          = bool(madj.get("invert_alt_direction", False)),
                invert_reference_pier_side    = str(madj.get("invert_reference_pier_side", "WEST")),
                pier_side_override            = str(madj.get("pier_side_override", "AUTO")),
                invert_correction_directions  = bool(madj.get("invert_correction_directions", False)),
            ),
            sdo_ref=SdoReferenceConfig(
                enabled         = bool(sdo.get("enabled", True)),
                image_url       = str(sdo.get("image_url",
                    "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_2048_HMIIF.jpg")),
                timeout_seconds = float(sdo.get("timeout_seconds", 10.0)),
                cache_minutes   = int(sdo.get("cache_minutes", 15)),
                cache_filename  = str(sdo.get("cache_filename", "sdo_reference.jpg")),
            ),
            gui=GuiConfig(
                theme                  = str(gui.get("theme",    "dark")),
                image_stretch          = str(gui.get("image_stretch", "auto")),
                drift_plot_history_min = int(gui.get("drift_plot_history_min", 30)),
                compass_scale          = str(gui.get("compass_scale", "arcmin")),
                font_size_pt           = int(gui.get("font_size_pt", 10)),
                show_drift_arrow       = bool(gui.get("show_drift_arrow", True)),
            ),
            logging=LoggingConfig(
                level        = str(log.get("level",        "INFO")),
                log_file     = str(log.get("log_file",     "sdaa.log")),
                max_bytes    = int(log.get("max_bytes",    5_242_880)),
                backup_count = int(log.get("backup_count", 3)),
            ),
        )
        return cfg

    @staticmethod
    def _dataclass_to_dict(obj: Any) -> Any:
        """Recursively convert dataclasses to plain dicts for YAML dumping."""
        if hasattr(obj, "__dataclass_fields__"):
            return {k: ConfigManager._dataclass_to_dict(v) for k, v in asdict(obj).items()}
        if isinstance(obj, dict):
            return {k: ConfigManager._dataclass_to_dict(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [ConfigManager._dataclass_to_dict(i) for i in obj]
        return obj

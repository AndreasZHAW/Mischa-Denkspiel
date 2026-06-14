"""
main.py
=======
SDAA entry point.  Run with:
    python main.py                      # normal GUI start
    python main.py --config my.yaml     # specify config file
    python main.py --simulate           # open simulator dialog immediately
    python main.py --session path.json  # open session for post-processing
"""

from __future__ import annotations

import argparse
import logging
import logging.handlers
import sys
from pathlib import Path


def _setup_logging(level_str: str, log_file: Path) -> None:
    level = getattr(logging, level_str.upper(), logging.INFO)
    fmt = "%(asctime)s  %(levelname)-8s  %(name)s  %(message)s"
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]
    try:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        handlers.append(logging.handlers.RotatingFileHandler(
            str(log_file), maxBytes=5_000_000, backupCount=3, encoding="utf-8"
        ))
    except Exception:
        pass
    logging.basicConfig(level=level, format=fmt, handlers=handlers)


def main() -> None:
    parser = argparse.ArgumentParser(description="Solar Drift Alignment Analyzer")
    parser.add_argument("--config",  type=Path, default=None, help="Path to config YAML")
    parser.add_argument("--session", type=Path, default=None, help="Open session for post-processing")
    parser.add_argument("--simulate", action="store_true",    help="Open simulator dialog on startup")
    args = parser.parse_args()

    # Load configuration
    from config.config_manager import ConfigManager
    config_path = args.config

    # Auto-discover user config if not given via --config.
    # Search order (first existing wins):
    #   1. A config saved next to the program itself (most portable)
    #   2. Documents/SDAA/sessions/  under the current user's home
    #   3. A few common variants
    if config_path is None:
        here = Path(__file__).resolve().parent
        candidate_locations = [
            here / "sdaa_config.yaml",                                  # next to main.py
            here / "sessions" / "sdaa_config.yaml",
            Path.home() / "Documents" / "SDAA" / "sessions" / "sdaa_config.yaml",
            Path.home() / "Documents" / "Imaging for the Life Sciences" / "SDAA" / "sessions" / "sdaa_config.yaml",
        ]
        for loc in candidate_locations:
            if loc.exists():
                config_path = loc
                break

    cm = ConfigManager(config_path=config_path)
    cfg = cm.config

    # Make sure the sessions folder exists (needed for logging + session saves).
    # On a fresh machine this folder may not exist yet.
    sessions_dir = Path(cfg.paths.sessions_folder)
    try:
        sessions_dir.mkdir(parents=True, exist_ok=True)
    except OSError:
        # Fall back to a folder next to the program if the configured path
        # is not writable (e.g. points at a drive that doesn't exist here).
        sessions_dir = Path(__file__).resolve().parent / "sessions"
        sessions_dir.mkdir(parents=True, exist_ok=True)
        cfg.paths.sessions_folder = str(sessions_dir)

    # Logging
    log_path = sessions_dir / cfg.logging.log_file
    _setup_logging(cfg.logging.level, log_path)

    from version import VERSION_STRING
    logger = logging.getLogger(__name__)
    logger.info("Starting %s", VERSION_STRING)
    if config_path:
        logger.info("Loaded config from %s", config_path)
    else:
        logger.info("No saved config – using built-in defaults. Save via Setup dialog.")

    # Launch Qt application
    from PyQt6.QtWidgets import QApplication
    from PyQt6.QtGui import QFont
    app = QApplication(sys.argv)
    app.setApplicationName("SDAA")
    app.setOrganizationName("SDAA")

    # Use the Fusion style so the app looks identical on every machine,
    # regardless of the Windows version or installed native theme.
    app.setStyle("Fusion")

    # Set a consistent base font size so the layout matches across monitors
    # with different DPI scaling.
    base_font = QFont("Segoe UI", cfg.gui.font_size_pt)
    app.setFont(base_font)

    from gui.main_window import MainWindow
    window = MainWindow(config_manager=cm)
    window.show()

    # Handle CLI flags
    if args.session:
        # Trigger open session post-processing
        window._on_open_session_path(args.session)
    if args.simulate:
        window._on_simulator()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()

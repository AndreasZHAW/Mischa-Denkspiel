"""
session/session_manager.py
===========================
Saves and loads SDAA sessions as JSON files.

File naming: sdaa_session_YYYYMMDD_HHMMSS.json
A config snapshot is saved alongside: sdaa_config_YYYYMMDD_HHMMSS.yaml
"""

from __future__ import annotations

import json
import logging
import shutil
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from session.session_model import Session, SessionSetup
from version import VERSION

logger = logging.getLogger(__name__)


class SessionManager:
    """
    Manages session persistence.

    Usage:
        mgr = SessionManager(Path("C:/AstroCapture/sessions"))
        mgr.new_session(setup)
        mgr.add_point(track_point)  # call repeatedly
        mgr.save()                  # can be called at any time
        old = mgr.load(path)        # load for post-processing
    """

    def __init__(self, sessions_folder: Path) -> None:
        self._folder  = Path(sessions_folder)
        self._folder.mkdir(parents=True, exist_ok=True)
        self._session: Optional[Session] = None
        self._save_path: Optional[Path]  = None

    # ------------------------------------------------------------------ public

    def new_session(self, setup: Optional[SessionSetup] = None) -> Session:
        """Start a new session.  Previous unsaved data is discarded."""
        now = datetime.now(tz=timezone.utc)
        sid = now.strftime("%Y%m%d_%H%M%S")
        self._session = Session(
            session_id  = sid,
            created_iso = now.isoformat(),
            updated_iso = now.isoformat(),
            setup       = setup or SessionSetup(sdaa_version=VERSION),
        )
        self._save_path = self._folder / f"sdaa_session_{sid}.json"
        logger.info("New session: %s", self._save_path)
        return self._session

    @property
    def current(self) -> Optional[Session]:
        return self._session

    def save(self, config_path: Optional[Path] = None) -> Path:
        """
        Save current session to JSON.

        Args:
            config_path: If given, also copy the config file alongside the session.

        Returns:
            Path to the saved JSON file.
        """
        if self._session is None:
            raise RuntimeError("No active session.")
        self._session.updated_iso = datetime.now(tz=timezone.utc).isoformat()
        data = asdict(self._session)
        assert self._save_path is not None
        with open(self._save_path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2, ensure_ascii=False)
        logger.info("Session saved: %s  (%d points)", self._save_path, len(self._session.points))

        if config_path and config_path.exists():
            dest = self._save_path.with_suffix(".yaml")
            shutil.copy2(config_path, dest)

        return self._save_path

    def load(self, path: Path) -> Session:
        """Load a session from a JSON file for post-processing."""
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        session = self._dict_to_session(data)
        self._session   = session
        self._save_path = path
        logger.info("Session loaded: %s  (%d points)", path, len(session.points))
        return session

    def list_sessions(self) -> list[Path]:
        """Return all session files sorted by date (newest first)."""
        files = sorted(
            self._folder.glob("sdaa_session_*.json"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        return files

    # ----------------------------------------------------------------- private

    @staticmethod
    def _dict_to_session(d: dict) -> Session:
        from session.session_model import (
            SessionTrackPoint, SessionDriftSolution,
            SessionPolarError, SessionSetup,
        )
        setup_d = d.get("setup", {})
        setup = SessionSetup(**setup_d) if setup_d else SessionSetup()

        points = [SessionTrackPoint(**p) for p in d.get("points", [])]
        drifts = [SessionDriftSolution(**dr) for dr in d.get("drift_solutions", [])]
        errors = [SessionPolarError(**e) for e in d.get("polar_errors", [])]

        return Session(
            session_id       = d["session_id"],
            created_iso      = d["created_iso"],
            updated_iso      = d["updated_iso"],
            setup            = setup,
            points           = points,
            drift_solutions  = drifts,
            polar_errors     = errors,
            notes            = d.get("notes", ""),
        )

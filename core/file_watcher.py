"""
core/file_watcher.py
====================
Monitors a folder (RECURSIVELY) for new image files and puts their paths
into a thread-safe queue consumed by the processing pipeline.

v0.2.0 changes:
- Recursive: also watches all subfolders.  This handles SharpCap's behaviour
  of creating one subfolder per capture (e.g. ".../2026-05-29/09_53_42/Sun_00001.fits").
- Filename collision safe: same name in different subfolders is fine because
  the full path is stored in the queue.
- Ignores hidden files, temp files, and non-image extensions explicitly.

Design:
- Uses the *watchdog* library (cross-platform inotify / FSEvents / ReadDirectoryChangesW).
- Runs the observer in its own thread; the rest of the app just polls the queue.
- Only emits events for supported image extensions (.fits .fit .tif .tiff .ser).
- For SER files, defers enqueueing until the file size is stable (write complete).
"""

from __future__ import annotations

import logging
import queue
import threading
import time
from pathlib import Path
from typing import Callable, Optional

from watchdog.events import FileCreatedEvent, FileMovedEvent, FileSystemEventHandler
from watchdog.observers import Observer

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".fits", ".fit", ".tif", ".tiff", ".ser"}
IGNORED_EXTENSIONS   = {".txt", ".log", ".ini", ".tmp", ".part", ".bak", ".yaml", ".json"}


class _ImageEventHandler(FileSystemEventHandler):
    def __init__(self, callback: Callable[[Path], None]) -> None:
        super().__init__()
        self._callback = callback

    def _maybe_emit(self, path_str: str) -> None:
        path = Path(path_str)
        ext = path.suffix.lower()
        if ext in SUPPORTED_EXTENSIONS:
            self._callback(path)
        # IGNORED_EXTENSIONS → silent skip (no log spam from CameraSettings.txt)

    def on_created(self, event: FileCreatedEvent) -> None:
        if not event.is_directory:
            self._maybe_emit(event.src_path)

    def on_moved(self, event: FileMovedEvent) -> None:
        if not event.is_directory:
            self._maybe_emit(event.dest_path)


class FileWatcher:
    """Watch a folder (and subfolders) for new image files."""

    def __init__(
        self,
        watch_folder: Path,
        *,
        ser_stability_seconds: float = 2.0,
        queue_maxsize: int = 5000,
        recursive: bool = True,
    ) -> None:
        self._folder = watch_folder
        self._ser_stability_s = ser_stability_seconds
        self._queue: queue.Queue[Path] = queue.Queue(maxsize=queue_maxsize)
        self._observer: Optional[Observer] = None
        self._running = False
        self._recursive = recursive
        self._seen_paths: set[Path] = set()
        self._seen_lock = threading.Lock()

    # ------------------------------------------------------------------ public

    def start(self) -> None:
        self._folder.mkdir(parents=True, exist_ok=True)
        self._running = True

        handler = _ImageEventHandler(self._on_new_file)
        self._observer = Observer()
        self._observer.schedule(handler, str(self._folder), recursive=self._recursive)
        self._observer.start()
        logger.info("FileWatcher started on %s (recursive=%s)",
                    self._folder, self._recursive)

        self._scan_existing()

    def stop(self) -> None:
        self._running = False
        if self._observer:
            self._observer.stop()
            self._observer.join(timeout=5.0)
            self._observer = None
        logger.info("FileWatcher stopped")

    def get_next(self, timeout: float = 0.1) -> Optional[Path]:
        try:
            return self._queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def task_done(self) -> None:
        self._queue.task_done()

    @property
    def pending_count(self) -> int:
        return self._queue.qsize()

    # ----------------------------------------------------------------- private

    def _on_new_file(self, path: Path) -> None:
        with self._seen_lock:
            if path in self._seen_paths:
                return
            self._seen_paths.add(path)

        if path.suffix.lower() == ".ser":
            threading.Thread(target=self._wait_ser_stable,
                             args=(path,), daemon=True).start()
        else:
            self._enqueue(path)

    def _wait_ser_stable(self, path: Path) -> None:
        stable_count = 0
        last_size = -1
        while stable_count < 3 and self._running:
            time.sleep(self._ser_stability_s / 3.0)
            try:
                size = path.stat().st_size
            except FileNotFoundError:
                return
            if size == last_size:
                stable_count += 1
            else:
                stable_count = 0
            last_size = size
        self._enqueue(path)

    def _enqueue(self, path: Path) -> None:
        try:
            self._queue.put_nowait(path)
            logger.debug("Queued: %s", path)
        except queue.Full:
            logger.warning("File queue full – dropping %s", path.name)

    def _scan_existing(self) -> None:
        if self._recursive:
            files = [p for p in self._folder.rglob("*")
                     if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS]
        else:
            files = [p for p in self._folder.iterdir()
                     if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS]

        files.sort(key=lambda p: p.stat().st_mtime)

        for f in files:
            with self._seen_lock:
                self._seen_paths.add(f)
            self._enqueue(f)

        if files:
            logger.info("Initial scan found %d existing file(s) in %s",
                        len(files), self._folder)

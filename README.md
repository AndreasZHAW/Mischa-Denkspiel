# SDAA – Solar Drift Alignment Analyzer  v0.1.0

Polar alignment of your equatorial mount using daytime solar drift measurement.  
No stars needed.  Works in full daylight.

---

## What it does

SDAA watches a folder for new FITS images from FireCapture or NINA, detects the solar disk in each frame using limb fitting, tracks the centre position over time, and computes the exact azimuth and altitude offset of your polar axis.

**Typical workflow:**
1. Attach solar filter → point telescope at sun → enable solar tracking
2. Configure FireCapture to output one FITS frame every 15 seconds
3. Start SDAA → wait 10–20 minutes
4. Read the correction: *"Rotate polar axis 3.4′ East, tilt 1.7′ Up"*
5. Correct → re-measure → iterate until error < 1′

---

## Hardware requirements

- Any equatorial mount with solar tracking (EQ6, EQ5, etc.)
- Any solar filter (white-light Baader film, ERF, etc.)
- Any camera FireCapture or NINA can control (mono or colour)
- Optional: ASCOM-compatible driver (EQMOD, GS Server) for position readout

## Software requirements

- Windows 10/11, Python 3.10+
- See `requirements.txt`

---

## Quick start

```bat
# Install dependencies
pip install -r requirements.txt

# Run
python main.py

# Build .exe
build_exe.bat
```

---

## Project structure

```
sdaa/
├── main.py                      Entry point
├── version.py                   Version number (update here only)
├── config/
│   ├── default_config.yaml      All settings with comments
│   └── config_manager.py        Typed config dataclasses
├── core/
│   ├── file_watcher.py          Folder monitoring (watchdog)
│   ├── image_loader.py          FITS/TIF/SER loader + debayering
│   ├── preprocessing.py         Bilateral filter, grayscale, stretch
│   ├── sun_detection.py         Hough + Taubin limb fit
│   ├── tracking_engine.py       Position history, outlier detection
│   ├── drift_solver.py          Weighted linear regression
│   ├── polar_alignment_solver.py  Drift → mount correction
│   ├── coordinate_transform.py  Pixel ↔ sky coordinates
│   └── refraction.py            Atmospheric refraction (Bennett 1982)
├── ascom/                       EQMOD / GS Server integration
├── gui/                         PyQt6 user interface
│   ├── main_window.py
│   ├── worker.py                Background processing thread
│   ├── panels/                  Live view, drift plot, polar error, …
│   └── dialogs/                 Setup wizard, calibration wizard, …
├── session/                     JSON session save/load
├── simulator/                   Synthetic test data generator
└── tests/                       pytest unit tests
```

---

## Camera rotation calibration

Before first use, run **Tools → Camera Rotation Wizard**:

1. Centre the sun in the image and start tracking
2. Click *Capture Position 1*
3. Slew the mount **East** by 5–15 arcmin using RA only
4. Click *Capture Position 2*
5. Click *Compute & Save*

The angle is saved in `config.yaml` and used for all future measurements.

---

## Test data

Use **Tools → Generate Test Data** to create synthetic FITS sequences with known drift.  
Scenarios A–F cover perfect alignment to severe misalignment with bad seeing.

---

## Accuracy notes

| Condition               | Typical accuracy |
|-------------------------|-----------------|
| 30 min, good seeing     | ±0.3′           |
| 10 min, good seeing     | ±1.0′           |
| 5 min                   | ±2–3′           |
| Sun below 30° altitude  | reduced (refraction) |
| No camera rot calibration | RA/Dec mixed  |

---

## Phase 2 roadmap

- [ ] ASCOM auto-correction slews (optional mode)
- [ ] Sunspot detection for secondary position reference
- [ ] Compass widget SVG rendering
- [ ] ASCOM mount position readout for jump detection

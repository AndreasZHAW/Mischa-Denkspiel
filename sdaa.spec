# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec file for SDAA
# Usage: pyinstaller sdaa.spec

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('config/default_config.yaml', 'config'),
    ],
    hiddenimports=[
        'PyQt6.QtSvg', 'PyQt6.QtPrintSupport',
        'astropy', 'astropy.io.fits', 'astropy.coordinates',
        'astropy.time', 'astropy.units',
        'cv2', 'scipy', 'numpy', 'pyqtgraph',
        'watchdog', 'watchdog.observers', 'watchdog.events',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='SDAA',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,      # no console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,          # add icon.ico here when available
)

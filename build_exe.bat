@echo off
REM SDAA – Build Windows EXE
REM Requirements: pip install pyinstaller
REM Run this from the sdaa\ project root directory

echo Building SDAA .exe with PyInstaller...

pyinstaller ^
  --name SDAA ^
  --onefile ^
  --windowed ^
  --add-data "config/default_config.yaml;config" ^
  --hidden-import PyQt6.QtSvg ^
  --hidden-import astropy ^
  --hidden-import cv2 ^
  --collect-all pyqtgraph ^
  --collect-all astropy ^
  main.py

echo.
echo Build complete: dist/SDAA.exe
pause

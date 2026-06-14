@echo off
REM ============================================================
REM  SDAA - Solar Drift Alignment Analyzer
REM  Self-installing launcher
REM
REM  This script:
REM    1. Finds a working Python 3.10+ interpreter automatically
REM    2. Installs all required packages on first run (or if missing)
REM    3. Starts the application
REM
REM  You do NOT need to install anything manually.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================================
echo   SDAA - Solar Drift Alignment Analyzer
echo ============================================================
echo.

REM ---------- 1. Find a Python interpreter ----------
set "PYEXE="

for %%V in (3.13 3.12 3.11 3.10 3) do (
    if not defined PYEXE (
        py -%%V -c "import sys" >nul 2>&1
        if !errorlevel! == 0 (
            set "PYEXE=py -%%V"
            echo Found Python via:  py -%%V
        )
    )
)

if not defined PYEXE (
    py -c "import sys" >nul 2>&1
    if !errorlevel! == 0 (
        set "PYEXE=py"
        echo Found Python via:  py
    )
)

if not defined PYEXE (
    python -c "import sys" >nul 2>&1
    if !errorlevel! == 0 (
        set "PYEXE=python"
        echo Found Python via:  python
    )
)

if not defined PYEXE (
    python3 -c "import sys" >nul 2>&1
    if !errorlevel! == 0 (
        set "PYEXE=python3"
        echo Found Python via:  python3
    )
)

if not defined PYEXE (
    echo.
    echo  ERROR: No Python interpreter found!
    echo.
    echo  Please install Python 3.10 or newer from:
    echo      https://www.python.org/downloads/
    echo.
    echo  IMPORTANT: During installation, tick the box
    echo      "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

REM ---------- 2. Check Python version is >= 3.10 ----------
%PYEXE% -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)" >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Your Python is too old. SDAA needs Python 3.10 or newer.
    %PYEXE% --version
    echo.
    echo  Please install a newer version from https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo Using interpreter:
%PYEXE% --version
echo.

REM ---------- 3. Check if dependencies are installed ----------
%PYEXE% -c "import yaml, PyQt6, pyqtgraph, astropy, cv2, numpy, scipy, watchdog, PIL" >nul 2>&1
if errorlevel 1 (
    echo ------------------------------------------------------------
    echo   First run detected - installing required packages...
    echo   This may take a few minutes. Please wait.
    echo ------------------------------------------------------------
    echo.
    %PYEXE% -m pip install --upgrade pip
    %PYEXE% -m pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo  ERROR: Package installation failed.
        echo  Check your internet connection and try again.
        echo.
        echo  If you are behind a proxy/firewall, you may need to
        echo  install manually with:
        echo      %PYEXE% -m pip install -r requirements.txt
        echo.
        pause
        exit /b 1
    )
    echo.
    echo   Installation complete!
    echo.
) else (
    echo All required packages are already installed.
    echo.
)

REM ---------- 4. Start the application ----------
echo ============================================================
echo   Starting SDAA...
echo ============================================================
echo.
%PYEXE% main.py

REM ---------- 5. Keep window open if it crashed ----------
if errorlevel 1 (
    echo.
    echo ------------------------------------------------------------
    echo   SDAA exited with an error ^(see messages above^).
    echo ------------------------------------------------------------
)
echo.
pause

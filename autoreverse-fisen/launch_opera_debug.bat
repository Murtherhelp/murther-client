@echo off
rem Fisen auxiliary launcher - prepares Opera with the CDP debug port.
rem NOT part of the fisen.py launch contract; fisen.py still runs as: python fisen.py
taskkill /IM opera.exe /F >nul 2>&1
timeout /t 2 /nobreak >nul
set "OPERA="
if exist "%LocalAppData%\Programs\Opera\opera.exe" set "OPERA=%LocalAppData%\Programs\Opera\opera.exe"
if exist "%LocalAppData%\Programs\Opera GX\opera.exe" set "OPERA=%LocalAppData%\Programs\Opera GX\opera.exe"
if exist "C:\Program Files\Opera\opera.exe" set "OPERA=C:\Program Files\Opera\opera.exe"
if not defined OPERA (
    echo Opera not found in common paths. Edit this bat with your opera.exe location.
    pause
    exit /b 1
)
start "" "%OPERA%" --remote-debugging-port=9222
echo Opera launched with CDP on port 9222. Now run: python fisen.py
pause

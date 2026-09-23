@echo off
rem Fisen auxiliary launcher - prepares Opera with the CDP debug port.
rem NOT part of the fisen.py launch contract; fisen.py still runs as: python fisen.py
rem
rem Why the dance below: --remote-debugging-port is silently IGNORED when the
rem new window joins an already-running Opera process, leaving :9222 dead and
rem verify.py grading nothing. So: kill first, CONFIRM the kill, then launch
rem with the flag in the normal profile (keeps Tampermonkey + the Murther
rem entry), then wait until the port actually answers.
taskkill /IM opera.exe /F /T >nul 2>&1
rem Opera shuts down slowly; wait up to 12s for the last process to exit
rem before declaring it wedged. (/T takes the whole tree: Flow, sidebar,
rem crash-handler children that otherwise outlive the parent.)
for /L %%i in (1,1,12) do (
    tasklist /FI "IMAGENAME eq opera.exe" 2>nul | find /I "opera.exe" >nul
    if errorlevel 1 goto :operadead
    timeout /t 1 /nobreak >nul
)
echo Opera is STILL running after kill + 12s. Likely causes:
echo   - tray icon alive: right-click the Opera icon by the clock, Exit.
echo   - Settings ^> System ^> "Continue running background apps" is ON.
echo   - another Windows session / elevated Opera owns it: run this bat from
echo     an Administrator prompt, or log that session off.
tasklist /FI "IMAGENAME eq opera.exe" /FO TABLE
pause
exit /b 1
:operadead
set "OPERA="
if exist "%LocalAppData%\Programs\Opera\opera.exe" set "OPERA=%LocalAppData%\Programs\Opera\opera.exe"
if exist "%LocalAppData%\Programs\Opera GX\opera.exe" set "OPERA=%LocalAppData%\Programs\Opera GX\opera.exe"
if exist "C:\Program Files\Opera\opera.exe" set "OPERA=C:\Program Files\Opera\opera.exe"
if not defined OPERA (
    echo Opera not found in common paths. Edit this bat with your opera.exe location.
    pause
    exit /b 1
)
start "" "%OPERA%" --remote-debugging-port=9222 about:blank
where curl >nul 2>&1
if errorlevel 1 (
    echo Launched, but curl is missing so this script cannot check the port.
    echo Open https://play.gota.io/ in THAT Opera window, then run: python verify.py
    pause
    exit /b 0
)
echo Waiting for CDP on :9222 ...
for /L %%i in (1,1,25) do (
    curl -s -m 2 http://127.0.0.1:9222/json/version >nul 2>&1
    if not errorlevel 1 (
        echo CDP is up on :9222.
        echo Now open https://play.gota.io/ in THAT Opera window, then run: python verify.py
        pause
        exit /b 0
    )
    timeout /t 1 /nobreak >nul
)
echo CDP never came up on :9222. If Opera opened anyway, close it fully and retry.
pause
exit /b 1

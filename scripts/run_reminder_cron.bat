@echo off
REM Run reminder process (sends due scheduled reminders for all firms).
REM Schedule this to run every minute in Windows Task Scheduler for automatic reminders.
REM Example: Task Scheduler -> Create Basic Task -> Daily -> Repeat every 1 minute -> Action: Start program -> this .bat

set PHP=F:\xampp\php\php.exe
set ROOT=%~dp0..
set SCRIPT=%ROOT%\api\reminders\process.php

if not exist "%PHP%" (
  echo PHP not found at %PHP%. Adjust PHP= in this script if needed.
  exit /b 1
)
if not exist "%SCRIPT%" (
  echo Script not found: %SCRIPT%
  exit /b 1
)

cd /d "%ROOT%"
"%PHP%" "%SCRIPT%" 2>&1

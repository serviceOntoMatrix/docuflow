@echo off
REM Run company_assigned_accountant_migration.sql against docuflow database
REM Uses XAMPP MySQL; adjust path if your MySQL is elsewhere

set DB_NAME=docuflow
set DB_USER=root
set DB_PASS=
set MYSQL=F:\xampp\mysql\bin\mysql
set MIGRATION=%~dp0..\database\company_assigned_accountant_migration.sql

if not exist "%MIGRATION%" (
  echo Migration file not found: %MIGRATION%
  exit /b 1
)

echo Running company_assigned_accountant_migration.sql on %DB_NAME%...
if "%DB_PASS%"=="" (
  "%MYSQL%" -u %DB_USER% %DB_NAME% < "%MIGRATION%"
) else (
  "%MYSQL%" -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%MIGRATION%"
)

if %ERRORLEVEL% equ 0 (
  echo Migration completed successfully.
) else (
  echo Migration failed. Check that MySQL is running and docuflow database exists.
  exit /b 1
)

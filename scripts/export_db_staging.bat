@echo off
REM Export database for MySQL 5.x staging server
REM Usage: export_db_staging.bat

set DB_NAME=docuflow
set DB_USER=root
set DB_PASS=
set OUTPUT_FILE=f:\xampp\htdocs\docuflow_web\database_staging.sql

echo Exporting database...

REM Export using mysqldump
set TEMP_FILE=f:\xampp\htdocs\docuflow_web\temp_export.sql

"F:\xampp\mysql\bin\mysqldump" -u %DB_USER% %DB_NAME% > "%TEMP_FILE%"

REM Fix MySQL 5.x compatibility issues
powershell -Command ^
  "(Get-Content '%TEMP_FILE%' -Raw) -replace 'DEFAULT uuid\(\)', '' -replace ' CHECK \(json_valid\(.+?\)\)', '' | Set-Content '%OUTPUT_FILE%' -NoNewline"

REM Cleanup
del "%TEMP_FILE%"

echo.
echo Done! Created %OUTPUT_FILE% (MySQL 5.x compatible)
echo.
pause

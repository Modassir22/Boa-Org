@echo off
echo Adding missing columns to upcoming_events table...
echo.

REM Load environment variables
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /v "^#"') do set %%a=%%b

REM Run the SQL file
mysql -u %DB_USER% -p%DB_PASSWORD% -h %DB_HOST% %DB_NAME% < config\add-missing-columns.sql

if %errorlevel% equ 0 (
    echo.
    echo ✓ Columns added successfully!
    echo New columns: title, description, location, start_date, end_date
) else (
    echo.
    echo ✗ Error adding columns
    echo If you see "Duplicate column" error, that's OK - column already exists
)

echo.
echo Checking updated table structure...
mysql -u %DB_USER% -p%DB_PASSWORD% -h %DB_HOST% %DB_NAME% -e "DESCRIBE upcoming_events;"

echo.
pause

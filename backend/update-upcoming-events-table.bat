@echo off
echo Updating upcoming_events table with countdown timer fields...
echo.

REM Load environment variables
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /v "^#"') do set %%a=%%b

REM Run the SQL file
mysql -u %DB_USER% -p%DB_PASSWORD% -h %DB_HOST% %DB_NAME% < config\update-upcoming-events-table.sql

if %errorlevel% equ 0 (
    echo.
    echo ✓ Table updated successfully!
    echo New columns added: location, start_date, end_date, link_url
) else (
    echo.
    echo ✗ Error updating table
)

echo.
pause

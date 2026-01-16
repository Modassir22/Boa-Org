@echo off
echo Checking upcoming_events table structure...
echo.

REM Load environment variables
for /f "tokens=1,2 delims==" %%a in ('type .env ^| findstr /v "^#"') do set %%a=%%b

REM Check table structure
mysql -u %DB_USER% -p%DB_PASSWORD% -h %DB_HOST% %DB_NAME% -e "DESCRIBE upcoming_events;"

echo.
echo Above is the current table structure.
echo.
echo Required columns:
echo - location
echo - start_date
echo - end_date
echo - link_url
echo.
pause

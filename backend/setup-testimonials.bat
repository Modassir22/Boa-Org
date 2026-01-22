@echo off
echo Setting up Testimonials Table...
echo.

mysql -u root -p"Modassir@9211" boa_connect < create-testimonials-table.sql

if %errorlevel% equ 0 (
    echo.
    echo ✓ Testimonials table created successfully!
    echo.
    echo You can now:
    echo 1. Go to Admin Panel
    echo 2. Click on "Testimonials" in Content Management section
    echo 3. Add, edit, or delete testimonials
    echo.
) else (
    echo.
    echo ✗ Failed to create testimonials table
    echo Please check your MySQL credentials and try again
    echo.
)

pause

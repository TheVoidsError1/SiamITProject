@echo off
echo ========================================
echo    สร้าง Superadmin ใหม่
echo ========================================
echo.

REM ตั้งค่า API URL
set API_URL=http://localhost:3000

REM ข้อมูล Superadmin
set NAME=Super Admin New
set EMAIL=superadmin_new@siamit.local
set PASSWORD=Admin@123
set DEPARTMENT=IT Department
set POSITION=No Position
set GENDER=ชาย
set PHONE=081-234-5678

echo กำลังสร้าง Superadmin...
echo ชื่อ: %NAME%
echo อีเมล: %EMAIL%
echo แผนก: %DEPARTMENT%
echo ตำแหน่ง: %POSITION%
echo.

REM ส่งคำสั่ง curl
curl -X POST "%API_URL%/api/create-user-with-role" ^
  -H "Content-Type: application/json" ^
  -d "{\"role\":\"superadmin\",\"name\":\"%NAME%\",\"department\":\"%DEPARTMENT%\",\"position\":\"%POSITION%\",\"email\":\"%EMAIL%\",\"password\":\"%PASSWORD%\",\"gender_name_th\":\"%GENDER%\",\"phone_number\":\"%PHONE%\"}"

echo.
echo ========================================
echo เสร็จสิ้น
echo ========================================
pause

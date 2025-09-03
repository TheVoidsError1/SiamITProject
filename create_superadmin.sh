#!/bin/bash

echo "========================================"
echo "    สร้าง Superadmin ใหม่"
echo "========================================"
echo

# ตั้งค่า API URL
API_URL="http://localhost:3000"

# ข้อมูล Superadmin
NAME="Super Admin New"
EMAIL="superadmin_new@siamit.local"
PASSWORD="Admin@123"
DEPARTMENT="IT Department"
POSITION="No Position"
GENDER="ชาย"
PHONE="081-234-5678"

echo "กำลังสร้าง Superadmin..."
echo "ชื่อ: $NAME"
echo "อีเมล: $EMAIL"
echo "แผนก: $DEPARTMENT"
echo "ตำแหน่ง: $POSITION"
echo

# ส่งคำสั่ง curl
curl -X POST "$API_URL/api/create-user-with-role" \
  -H "Content-Type: application/json" \
  -d "{
    \"role\": \"superadmin\",
    \"name\": \"$NAME\",
    \"department\": \"$DEPARTMENT\",
    \"position\": \"$POSITION\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"gender_name_th\": \"$GENDER\",
    \"phone_number\": \"$PHONE\"
  }"

echo
echo "========================================"
echo "เสร็จสิ้น"
echo "========================================"

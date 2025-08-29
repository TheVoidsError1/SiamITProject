@echo off
set DB_HOST=localhost
set DB_PORT=3306
set DB_USERNAME=root
set DB_PASSWORD=
set DB_DATABASE=siamitleave
set DB_TYPE=mysql
set JWT_SECRET=your_jwt_secret_here
set SEED_SUPERADMIN_EMAIL=superadmin@siamit.local
set SEED_SUPERADMIN_PASSWORD=Admin@123

echo Running database seeding script...
node scripts/seed_initial_data.js
pause

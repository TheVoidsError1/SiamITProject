-- Migration script to update tables with new columns
-- Date: 2024
-- Description: Add new_year_quota to position table and update user/admin/superadmin tables

-- 1. Add new_year_quota column to position table
ALTER TABLE position 
ADD COLUMN new_year_quota INT DEFAULT 0;

-- 2. Update users table
-- Remove avatar column and add new columns
ALTER TABLE users 
DROP COLUMN avatar,
ADD COLUMN gender VARCHAR(255) NULL,
ADD COLUMN dob DATE NULL,
ADD COLUMN phone_number VARCHAR(255) NULL,
ADD COLUMN start_work DATE NULL,
ADD COLUMN end_work DATE NULL;

-- 3. Update admin table
-- Remove avatar column and add new columns
ALTER TABLE admin 
DROP COLUMN avatar,
ADD COLUMN gender VARCHAR(255) NULL,
ADD COLUMN dob DATE NULL,
ADD COLUMN phone_number VARCHAR(255) NULL,
ADD COLUMN start_work DATE NULL,
ADD COLUMN end_work DATE NULL;

-- 4. Update superadmin table
-- Remove avatar column and add new columns
ALTER TABLE superadmin 
DROP COLUMN avatar,
ADD COLUMN gender VARCHAR(255) NULL,
ADD COLUMN dob DATE NULL,
ADD COLUMN phone_number VARCHAR(255) NULL,
ADD COLUMN start_work DATE NULL,
ADD COLUMN end_work DATE NULL;

-- Add comments for documentation
COMMENT ON COLUMN position.new_year_quota IS 'New year quota for the position';
COMMENT ON COLUMN users.gender IS 'User gender';
COMMENT ON COLUMN users.dob IS 'Date of birth';
COMMENT ON COLUMN users.phone_number IS 'Phone number';
COMMENT ON COLUMN users.start_work IS 'Start work date';
COMMENT ON COLUMN users.end_work IS 'End work date';
COMMENT ON COLUMN admin.gender IS 'Admin gender';
COMMENT ON COLUMN admin.dob IS 'Date of birth';
COMMENT ON COLUMN admin.phone_number IS 'Phone number';
COMMENT ON COLUMN admin.start_work IS 'Start work date';
COMMENT ON COLUMN admin.end_work IS 'End work date';
COMMENT ON COLUMN superadmin.gender IS 'Super admin gender';
COMMENT ON COLUMN superadmin.dob IS 'Date of birth';
COMMENT ON COLUMN superadmin.phone_number IS 'Phone number';
COMMENT ON COLUMN superadmin.start_work IS 'Start work date';
COMMENT ON COLUMN superadmin.end_work IS 'End work date';

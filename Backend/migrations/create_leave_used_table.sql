-- Migration script to create leave_used table
-- Date: 2024
-- Description: Create new leave_used table to track leave usage

CREATE TABLE IF NOT EXISTS leave_used (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    leave_type VARCHAR(255) NOT NULL,
    days INT DEFAULT 0,
    hour INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_user_id (user_id),
    INDEX idx_leave_type (leave_type),
    INDEX idx_created_at (created_at)
);

-- Add comments for documentation
COMMENT ON TABLE leave_used IS 'Table to track leave usage by users';
COMMENT ON COLUMN leave_used.id IS 'Primary key - UUID';
COMMENT ON COLUMN leave_used.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN leave_used.leave_type IS 'Type of leave used';
COMMENT ON COLUMN leave_used.days IS 'Number of days used';
COMMENT ON COLUMN leave_used.hour IS 'Number of hours used';
COMMENT ON COLUMN leave_used.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN leave_used.updated_at IS 'Record last update timestamp';

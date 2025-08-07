# Configuration Guide

This project now uses environment variables to avoid hardcoded values. Here's how to configure it:

## Environment Variables

Create a `.env` file in the Backend directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=siamitleave
DB_TYPE=mysql

# File Upload Configuration
UPLOADS_BASE_DIR=uploads
ANNOUNCEMENTS_UPLOAD_DIR=announcements
AVATARS_UPLOAD_DIR=avatars
LEAVE_UPLOADS_DIR=leave-uploads
MAX_FILE_SIZE=5242880

# Server Configuration
PORT=3001
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1h
VITE_API_BASE_URL=http://localhost:3001

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:8081,http://192.168.50.64:8081,http://192.168.50.125:8081,http://192.168.50.90:8081,http://192.168.50.54:8081,http://localhost:3000,http://localhost:3001,http://localhost:8080,http://localhost:8001

# Pagination Configuration
DEFAULT_PAGINATION_LIMIT=6
MAX_PAGINATION_LIMIT=50

# Application Configuration
APP_TITLE=SiamITLeave API
APP_VERSION=1.0.0

# Business Logic Configuration
MAX_LEAVE_DAYS=20
WORKING_HOURS_PER_DAY=9
WORKING_START_HOUR=9
WORKING_END_HOUR=18
MIN_DATE=2000-01-01
MAX_DATE=3000-01-01
```

## Benefits of This Approach

1. **No Hardcoded Paths**: Upload directories are now configurable
2. **Environment-Specific Settings**: Different settings for development, staging, and production
3. **Security**: Sensitive data like database passwords and JWT secrets are externalized
4. **Flexibility**: Easy to change settings without modifying code
5. **Deployment Ready**: Works across different environments

## Default Values

If no `.env` file is provided, the system will use these default values:
- Uploads base directory: `uploads`
- Announcements subdirectory: `announcements`
- Avatars subdirectory: `avatars`
- Leave uploads directory: `leave-uploads`
- Max file size: 5MB
- Server port: 3001
- Database: localhost with default credentials
- JWT expiration: 1 hour
- Default pagination limit: 6 items
- Max pagination limit: 50 items
- Max leave days: 20 days
- Working hours per day: 9 hours
- Working hours: 9:00 AM - 6:00 PM
- Date range: 2000-01-01 to 3000-01-01

## Usage in Code

The configuration is now centralized in `config.js` and can be imported in any file:

```javascript
const config = require('./config');

// Get uploads path
const uploadsPath = config.getUploadsPath();
const announcementsPath = config.getAnnouncementsUploadPath();

// Get database config
const dbConfig = config.database;

// Get server config
const serverConfig = config.server;
```

## What Changed

### Before (Hardcoded):
```javascript
const uploadsDir = path.join(__dirname, '../uploads/announcements');
const port = 3001;
const dbPassword = '';
const jwtSecret = 'your_secret_key';
const fileSize = 5 * 1024 * 1024;
const paginationLimit = 6;
const maxLeaveDays = 20;
const workingHours = 9;
```

### After (Configurable):
```javascript
const config = require('../config');
const uploadsDir = config.getAnnouncementsUploadPath();
const port = config.server.port;
const dbPassword = config.database.password;
const jwtSecret = config.server.jwtSecret;
const fileSize = config.uploads.maxFileSize;
const paginationLimit = config.pagination.defaultLimit;
const maxLeaveDays = config.business.maxLeaveDays;
const workingHours = config.business.workingHoursPerDay;
```

## Files Updated

The following files have been updated to use the configuration system:

- `index.js` - Database config, server port, CORS origins, JWT secrets
- `AnnouncementsController.js` - Upload paths, file size limits
- `ProfileController.js` - Avatar upload paths, file size limits
- `LeaveRequestController.js` - Leave upload paths, pagination limits
- `LeaveHistoryController.js` - Pagination limits
- `EmployeeController.js` - Pagination limits
- `LoginController.js` - JWT secrets and expiration
- `RegisterController.js` - JWT secrets and expiration
- `MidController.js` - JWT secrets and expiration
- `SuperAdminController.js` - JWT secrets and expiration
- `LineController.js` - API base URL
- `DashboardIndexController.js` - Business logic constants (max leave days, working hours)
- `LeaveHistoryController.js` - Business logic constants (working hours, date ranges)
- `LeaveRequestController.js` - Business logic constants (working hours, date ranges)
- `authMiddleware.js` - JWT secret 
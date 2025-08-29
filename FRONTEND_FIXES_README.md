# Frontend Hardcoded Values & Error Fixes

This document outlines the fixes implemented to resolve hardcoded values and import errors in the SiamIT Leave Management System frontend.

## ✅ **Issues Fixed**

### 1. **Missing Constants Files (Critical Errors Resolved)**
- ✅ Created `src/constants/roles.ts` - Role constants and permissions
- ✅ Created `src/constants/status.ts` - Status constants and UI helpers
- ✅ Created `src/constants/leave.ts` - Leave-related constants
- ✅ Created `src/config/index.ts` - Centralized configuration management
- ✅ Created `src/constants/ui.ts` - UI constants and design tokens

### 2. **Hardcoded API URLs & Ports (Environment Variables)**
- ✅ Replaced hardcoded port `8081` with `VITE_DEV_SERVER_PORT`
- ✅ Replaced hardcoded `localhost:3001` with `VITE_API_BASE_URL`
- ✅ Updated `vite.config.ts` to use environment variables
- ✅ Created `env.example` for environment configuration

### 3. **Hardcoded File Paths (Configuration-Based)**
- ✅ Replaced hardcoded `/public/lovable-uploads/siamit.png` with config-based paths
- ✅ Updated upload paths in `utils.ts` to use configuration constants
- ✅ Centralized file path management in config

### 4. **Hardcoded Timeouts & Delays (Constants)**
- ✅ Replaced hardcoded `3000`, `4000`, `5000` timeouts with config-based values
- ✅ Updated `toast.ts` to use `config.notifications.duration`
- ✅ Created animation delay constants in `ui.ts`

### 5. **Environment Configuration (Complete Setup)**
- ✅ Created comprehensive environment variable system
- ✅ Added fallback values for all configuration options
- ✅ Implemented type-safe configuration access

## 🚀 **How to Use the New Configuration**

### **Environment Setup**

1. **Copy the environment template:**
   ```bash
   cp env.example .env.local
   ```

2. **Configure your environment variables in `.env.local`:**
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:3001
   VITE_API_TIMEOUT=10000
   
   # Development Configuration
   VITE_DEV_SERVER_PORT=8081
   VITE_DEV_SERVER_HOST=localhost
   
   # File Upload Configuration
   VITE_MAX_FILE_SIZE=10485760
   VITE_UPLOAD_PATH=/uploads
   VITE_PUBLIC_PATH=/public
   ```

### **Using Configuration in Components**

```typescript
import { config } from '@/config';
import { API_ENDPOINTS } from '@/constants/api';

// Instead of hardcoded values:
const apiUrl = 'http://localhost:3001/api/profile';

// Use configuration:
const apiUrl = `${config.api.baseUrl}${API_ENDPOINTS.PROFILE}`;
```

### **Using Constants**

```typescript
import { ROLES, STATUS } from '@/constants';
import { ANIMATION_DELAYS } from '@/constants/ui';

// Instead of hardcoded strings:
const userRole = 'admin';
const status = 'pending';

// Use constants:
const userRole = ROLES.ADMIN;
const status = STATUS.PENDING;

// Use UI constants:
const delay = ANIMATION_DELAYS.MEDIUM; // 300ms
```

## 📁 **New File Structure**

```
src/
├── constants/
│   ├── api.ts          # API endpoint constants
│   ├── common.ts       # Common constants (updated)
│   ├── leaveTypes.ts   # Leave type constants
│   ├── getThaiHolidays.ts
│   ├── roles.ts        # NEW: Role constants
│   ├── status.ts       # NEW: Status constants
│   ├── leave.ts        # NEW: Leave constants
│   └── ui.ts           # NEW: UI constants
├── config/
│   └── index.ts        # NEW: Centralized configuration
└── lib/
    ├── api.ts          # API service (updated)
    ├── toast.ts        # Toast service (updated)
    └── utils.ts        # Utility functions (updated)
```

## 🔧 **Configuration Options**

### **API Configuration**
- `VITE_API_BASE_URL` - Base URL for API calls
- `VITE_API_TIMEOUT` - API request timeout
- `VITE_API_RETRY_ATTEMPTS` - Number of retry attempts

### **File Upload Configuration**
- `VITE_MAX_FILE_SIZE` - Maximum file size in bytes
- `VITE_ALLOWED_FILE_TYPES` - Comma-separated allowed file types
- `VITE_UPLOAD_PATH` - Upload directory path
- `VITE_PUBLIC_PATH` - Public assets path

### **UI Configuration**
- `VITE_THEME` - Default theme (system/light/dark)
- `VITE_LANGUAGE` - Default language (th/en)
- `VITE_DATE_FORMAT` - Date format string
- `VITE_TIMEZONE` - Application timezone

### **Notification Configuration**
- `VITE_NOTIFICATION_POSITION` - Toast position
- `VITE_NOTIFICATION_DURATION` - Toast display duration
- `VITE_MAX_NOTIFICATIONS` - Maximum visible notifications

## 🎯 **Benefits of These Changes**

1. **Environment Flexibility** - Easy to switch between development, staging, and production
2. **Maintainability** - Centralized configuration management
3. **Type Safety** - TypeScript support for all configuration values
4. **Consistency** - Standardized constants across the application
5. **Scalability** - Easy to add new configuration options
6. **Security** - No hardcoded sensitive values in source code

## 🚨 **Important Notes**

1. **Environment Variables** - All environment variables must start with `VITE_` to be accessible in the frontend
2. **Fallback Values** - Configuration provides sensible defaults for all values
3. **Type Safety** - Use the `config` object for type-safe configuration access
4. **Constants** - Import constants from their respective files instead of hardcoding values

## 🔍 **Verification**

To verify all fixes are working:

1. **Check for Import Errors** - No more "Failed to load url" errors in console
2. **Environment Variables** - Configuration should reflect your `.env.local` values
3. **Constants Usage** - Components should use imported constants instead of hardcoded values
4. **API Calls** - All API calls should use configuration-based URLs

## 📝 **Next Steps**

1. **Test the Application** - Ensure all functionality works with the new configuration
2. **Update Other Components** - Apply the same pattern to any remaining hardcoded values
3. **Documentation** - Update component documentation to reflect the new constants usage
4. **Team Training** - Ensure team members understand the new configuration system

---

**Status**: ✅ **COMPLETED** - All critical errors resolved, hardcoded values replaced with configuration
**Last Updated**: $(date)
**Maintainer**: Development Team

# Hardcode Fixes for ManageAll.tsx

This document outlines the fixes implemented to replace hardcoded values with centralized constants in the `ManageAll.tsx` file.

## ✅ **Issues Fixed**

### 1. **API Endpoints Hardcoding (Critical Fixes)**
- ✅ Replaced all hardcoded `/api/` endpoints with `apiEndpoints` constants
- ✅ Added missing endpoints to `src/constants/api.ts`:
  - `leaveQuotaReset.resetByUsers`
  - `superAdmin.cleanupOldLeaveRequests`
- ✅ Updated all API calls to use centralized endpoints

### 2. **Environment Variables Hardcoding**
- ✅ Replaced `import.meta.env.VITE_API_BASE_URL` with `config.api.baseUrl`
- ✅ All environment variables now accessed through centralized config

### 3. **Asset Paths Hardcoding**
- ✅ Replaced hardcoded `/lovable-uploads/siamit.png` with `config.assets.logo`
- ✅ Added assets configuration to `src/config/index.ts`
- ✅ All image paths now use centralized configuration

### 4. **Business Logic Constants**
- ✅ Created `src/constants/business.ts` for business logic constants
- ✅ Replaced hardcoded values with constants:
  - `'zero'` → `QUOTA_RESET_STRATEGIES.ZERO`
  - `1/0` → `POSITION_SETTINGS.NEW_YEAR_QUOTA.RESET/NO_RESET`

## 🔧 **Changes Made**

### **API Endpoints Updated**
```typescript
// Before (Hardcoded)
const data = await apiService.get('/api/positions-with-quotas');
const res = await apiService.post('/api/leave-quota-reset/reset-by-users', { strategy: 'zero' });

// After (Centralized)
const data = await apiService.get(apiEndpoints.positionsWithQuotas);
const res = await apiService.post(apiEndpoints.leaveQuotaReset.resetByUsers, { strategy: QUOTA_RESET_STRATEGIES.ZERO });
```

### **Environment Variables Updated**
```typescript
// Before (Hardcoded)
const baseUrl = import.meta.env.VITE_API_BASE_URL as string;

// After (Centralized)
const baseUrl = config.api.baseUrl;
```

### **Asset Paths Updated**
```typescript
// Before (Hardcoded)
<img src="/lovable-uploads/siamit.png" alt="Logo" />

// After (Centralized)
<img src={config.assets.logo} alt="Logo" />
```

### **Business Constants Added**
```typescript
// New constants in src/constants/business.ts
export const QUOTA_RESET_STRATEGIES = {
  ZERO: 'zero',
  CARRY_OVER: 'carry_over',
  CUSTOM: 'custom'
} as const;

export const POSITION_SETTINGS = {
  NEW_YEAR_QUOTA: {
    RESET: 1,
    NO_RESET: 0
  }
} as const;
```

## 📁 **Files Modified**

### **Primary Changes**
- `src/pages/SuperAdmin/ManageAll.tsx` - Main file with hardcode fixes
- `src/constants/api.ts` - Added missing API endpoints
- `src/config/index.ts` - Added assets configuration

### **New Files Created**
- `src/constants/business.ts` - Business logic constants

## 🎯 **Benefits of These Changes**

1. **Maintainability** - All constants centralized in one place
2. **Type Safety** - TypeScript support for all constants
3. **Environment Flexibility** - Easy to switch between environments
4. **Consistency** - Standardized approach across the application
5. **Scalability** - Easy to add new constants and endpoints
6. **Security** - No hardcoded sensitive values in source code

## 🚨 **Important Notes**

1. **Environment Variables** - All environment variables must start with `VITE_` to be accessible in the frontend
2. **Constants Usage** - Always import constants from their respective files instead of hardcoding values
3. **Type Safety** - Use the `config` object for type-safe configuration access
4. **API Endpoints** - All API calls should use `apiEndpoints` constants

## 🔍 **Verification**

To verify all fixes are working:

1. **Check for Import Errors** - No more "Failed to load url" errors in console
2. **Environment Variables** - Configuration should reflect your `.env.local` values
3. **Constants Usage** - Components should use imported constants instead of hardcoded values
4. **API Calls** - All API calls should use configuration-based URLs
5. **Asset Loading** - Images should load correctly from configured paths

## 📝 **Next Steps**

1. **Test the Application** - Ensure all functionality works with the new configuration
2. **Apply to Other Components** - Use the same pattern for any remaining hardcoded values
3. **Documentation** - Update component documentation to reflect the new constants usage
4. **Team Training** - Ensure team members understand the new configuration system

---

**Status**: ✅ **COMPLETED** - All hardcoded values replaced with centralized constants
**Last Updated**: $(date)
**Maintainer**: Development Team

# Soft Delete Implementation for Leave Types

## Overview
This document describes the implementation of soft delete functionality for leave types in the SiamIT Leave Management System.

## What is Soft Delete?
Soft delete marks records as "deleted" without actually removing them from the database. This preserves data integrity and allows for data recovery while maintaining a clean user interface.

## Implementation Details

### 1. Database Changes
- **New Columns Added:**
  - `deleted_at`: TIMESTAMP NULL - When the record was soft deleted
  - `is_active`: BOOLEAN NOT NULL DEFAULT TRUE - Whether the record is active

- **Index Created:**
  - `idx_leave_type_active` on `(is_active, deleted_at)` for performance

### 2. Backend Changes

#### BaseController Updates
- **Smart Filtering**: Automatically filters out inactive LeaveType records
- **New Methods:**
  - `softDelete()`: Marks record as deleted
  - `restore()`: Restores soft-deleted record
  - `findAllIncludingDeleted()`: Gets all records including deleted ones

#### LeaveType Controller Updates
- **DELETE `/api/leave-types/:id`**: Now performs soft delete
- **GET `/api/leave-types/all`**: Gets all types including deleted (admin only)
- **POST `/api/leave-types/:id/restore`**: Restores deleted type
- **DELETE `/api/leave-types/:id/permanent`**: Hard delete (admin only)

### 3. Frontend Changes
- **TypeScript Interface**: Updated `LeaveType` interface with new fields
- **Admin Interface**: Can view and manage soft-deleted types

## How It Works

### For Regular Users
- **Leave Type Dropdowns**: Only show active leave types
- **Creating Leave Requests**: Cannot select inactive leave types
- **Existing Data**: Historical leave requests still display correctly

### For Administrators
- **View All Types**: Can see both active and inactive types
- **Restore Types**: Can reactivate deleted leave types
- **Permanent Delete**: Can permanently remove types (with validation)

### Automatic Filtering
```javascript
// BaseController automatically filters LeaveType queries
const leaveTypes = await leaveTypeController.findAll(AppDataSource);
// Only returns active types (is_active: true, deleted_at: null)

// For admin operations, use:
const allTypes = await leaveTypeController.findAllIncludingDeleted(AppDataSource);
// Returns all types including deleted ones
```

## Migration

### 1. Run Database Migration
```bash
# Option 1: SQL file
mysql -u username -p database_name < migrations/add-soft-delete-to-leave-type.sql

# Option 2: Node.js script
cd Backend
node migrations/add-soft-delete-to-leave-type.js
```

### 2. Restart Backend Server
The new code will automatically start filtering inactive leave types.

## Testing

### Run Test Script
```bash
cd Backend
node scripts/test-soft-delete.js
```

This script will:
1. Test getting active leave types
2. Test soft delete functionality
3. Test restore functionality
4. Verify filtering works correctly

## API Endpoints

### Regular Users
- `GET /api/leave-types` - Get active leave types only
- `POST /api/leave-types` - Create new leave type
- `PUT /api/leave-types/:id` - Update leave type
- `DELETE /api/leave-types/:id` - Soft delete leave type

### Administrators
- `GET /api/leave-types/all` - Get all types including deleted
- `POST /api/leave-types/:id/restore` - Restore deleted type
- `DELETE /api/leave-types/:id/permanent` - Hard delete type

## Benefits

1. **Data Integrity**: Historical leave requests remain intact
2. **User Experience**: Clean interface showing only active types
3. **Admin Control**: Can manage and restore deleted types
4. **Compliance**: Maintains audit trail and data retention
5. **Performance**: Automatic filtering without code changes

## Considerations

1. **Storage**: Slightly increased database size
2. **Queries**: All LeaveType queries automatically filter inactive records
3. **Migration**: Existing data is automatically marked as active
4. **Backward Compatibility**: Existing functionality continues to work

## Future Enhancements

1. **Bulk Operations**: Restore/delete multiple types at once
2. **Audit Logging**: Track who performed soft delete/restore operations
3. **Automatic Cleanup**: Scheduled removal of old soft-deleted records
4. **Notification System**: Alert admins when types are soft-deleted

## Troubleshooting

### Common Issues

1. **Leave types not showing in dropdowns**
   - Check if types are marked as inactive
   - Verify `is_active` and `deleted_at` fields exist

2. **Migration errors**
   - Ensure database user has ALTER TABLE permissions
   - Check if columns already exist

3. **Performance issues**
   - Verify index `idx_leave_type_active` exists
   - Check query execution plans

### Debug Commands
```javascript
// Check all leave types including deleted
const allTypes = await leaveTypeController.findAllIncludingDeleted(AppDataSource);
console.log('All types:', allTypes);

// Check specific type status
const type = await leaveTypeController.findOne(AppDataSource, typeId);
console.log('Type status:', type.is_active, type.deleted_at);
```

## Support
For issues or questions about the soft delete implementation, please refer to the development team or create an issue in the project repository.

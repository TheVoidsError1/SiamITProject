# Leave Type Cleanup Service

## Overview
The Leave Type Cleanup Service automatically manages soft-deleted leave types by checking if they can be permanently removed when they're no longer in use. This prevents database bloat while maintaining data integrity.

## Features

### 🔒 **Safety First**
- **Never deletes** leave types that are still in use
- **Comprehensive checks** across multiple related tables
- **Transaction-safe** operations with rollback on errors

### 🤖 **Automated Cleanup**
- **Daily scheduled cleanup** at 2 AM (configurable)
- **Manual trigger** via API endpoint
- **Smart detection** of orphaned leave types

### 📊 **Comprehensive Monitoring**
- **Detailed logging** of all cleanup operations
- **Audit trail** of what was deleted and why
- **Error reporting** for failed operations

## How It Works

### 1. **Soft Delete Process**
When a leave type is "deleted":
1. Record is marked with `deleted_at` timestamp
2. `is_active` is set to `false`
3. Record remains in database but is hidden from users

### 2. **Cleanup Eligibility Check**
Before permanent deletion, the service checks:
- ✅ Leave type exists and is soft-deleted
- ✅ No active leave requests (pending/approved/in_progress)
- ✅ No leave quotas using this type
- ✅ Historical data can be preserved

### 3. **Automatic Cleanup**
- **Daily at 2 AM**: Scans all soft-deleted types
- **Safe deletion**: Only removes truly orphaned types
- **Logging**: Records all actions for monitoring

## API Endpoints

### **Check Deletion Eligibility**
```http
GET /api/leave-types/:id/can-delete-permanently
```
**Response:**
```json
{
  "success": true,
  "data": {
    "canDelete": true,
    "reason": "No active usage found",
    "details": {
      "leaveType": { /* leave type data */ },
      "historicalRequests": 5,
      "leaveQuotas": 0,
      "softDeletedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Deletion eligibility checked successfully"
}
```

### **Safe Permanent Deletion**
```http
DELETE /api/leave-types/:id/permanent-safe
```
**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Leave type permanently deleted",
    "details": { /* deletion details */ }
  },
  "message": "Leave type permanently deleted safely"
}
```

### **Trigger Manual Cleanup**
```http
POST /api/leave-types/auto-cleanup
```
**Response:**
```json
{
  "success": true,
  "data": {
    "totalChecked": 3,
    "deleted": [
      {
        "id": "123",
        "name": "Old Leave Type",
        "reason": "No active usage found"
      }
    ],
    "cannotDelete": [
      {
        "id": "456",
        "name": "Active Leave Type",
        "reason": "Leave type has 2 active leave request(s)"
      }
    ],
    "errors": []
  },
  "message": "Auto-cleanup completed successfully"
}
```

## Configuration

### **Environment Variables**
```bash
# Enable/disable daily cleanup (default: true)
ENABLE_LEAVE_TYPE_CLEANUP_CRON=true

# Timezone for scheduled jobs (default: Asia/Bangkok)
CRON_TZ=Asia/Bangkok
```

### **Scheduled Cleanup Time**
- **Default**: Every day at 2:00 AM
- **Cron Expression**: `0 2 * * *`
- **Timezone**: Asia/Bangkok (configurable)

## Usage Examples

### **Check if a Leave Type Can Be Deleted**
```javascript
// Frontend example
const checkDeletion = async (leaveTypeId) => {
  try {
    const response = await fetch(`/api/leave-types/${leaveTypeId}/can-delete-permanently`);
    const result = await response.json();
    
    if (result.data.canDelete) {
      console.log('Safe to delete:', result.data.reason);
    } else {
      console.log('Cannot delete:', result.data.reason);
    }
  } catch (error) {
    console.error('Error checking deletion eligibility:', error);
  }
};
```

### **Safely Delete a Leave Type**
```javascript
// Frontend example
const safeDelete = async (leaveTypeId) => {
  try {
    const response = await fetch(`/api/leave-types/${leaveTypeId}/permanent-safe`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (result.success) {
      console.log('Leave type deleted successfully');
    }
  } catch (error) {
    console.error('Error deleting leave type:', error);
  }
};
```

### **Trigger Manual Cleanup**
```javascript
// Admin panel example
const triggerCleanup = async () => {
  try {
    const response = await fetch('/api/leave-types/auto-cleanup', {
      method: 'POST'
    });
    const result = await response.json();
    
    console.log('Cleanup results:', result.data);
    console.log(`Deleted: ${result.data.deleted.length}`);
    console.log(`Cannot delete: ${result.data.cannotDelete.length}`);
  } catch (error) {
    console.error('Error triggering cleanup:', error);
  }
};
```

## Testing

### **Run Test Script**
```bash
cd Backend
node scripts/test-leave-type-cleanup.js
```

The test script will:
1. Connect to database
2. Check for soft-deleted leave types
3. Test deletion eligibility
4. Run auto-cleanup (dry run)
5. Display results

### **Test Output Example**
```
🚀 Starting Leave Type Cleanup Service test...
✅ Database connection established
✅ Cleanup service created

🔍 Test 1: Checking all soft-deleted leave types...
📊 Total leave types: 8
🗑️ Soft-deleted types: 2
📋 Soft-deleted leave types:
  1. ID: 123, Name: Old Leave Type, Deleted: 2024-01-15T10:30:00.000Z
  2. ID: 456, Name: Unused Type, Deleted: 2024-01-16T14:20:00.000Z

🔍 Test 2: Checking if leave type 123 can be permanently deleted...
📋 Deletion eligibility check result: { canDelete: true, reason: 'No active usage found' }
✅ Leave type can be permanently deleted

🔄 Test 4: Running auto-cleanup check...
📊 Auto-cleanup results: { totalChecked: 2, deleted: [], cannotDelete: [], errors: [] }

✅ All tests completed successfully!
🔌 Database connection closed
```

## Monitoring & Logging

### **Console Logs**
The service provides detailed console logging:
```
[CRON] Leave type cleanup job scheduled at 02:00 daily (Asia/Bangkok)
🔄 Starting scheduled leave type cleanup...
✅ Scheduled cleanup completed: { totalChecked: 3, deleted: 1, cannotDelete: 2, errors: 0 }
🗑️ Deleted leave types: [{ id: '123', name: 'Old Leave Type', reason: 'No active usage found' }]
⚠️ Cannot delete leave types: [{ id: '456', name: 'Active Type', reason: 'Leave type has 2 active leave request(s)' }]
```

### **Database Monitoring**
Check cleanup status by querying:
```sql
-- View all soft-deleted leave types
SELECT id, leave_type_en, leave_type_th, deleted_at, is_active 
FROM leave_type 
WHERE deleted_at IS NOT NULL;

-- Check for active leave requests using a specific type
SELECT COUNT(*) as active_requests 
FROM leave_request 
WHERE leaveTypeId = '123' 
AND status IN ('pending', 'approved', 'in_progress');
```

## Troubleshooting

### **Common Issues**

1. **Cleanup not running**
   - Check `ENABLE_LEAVE_TYPE_CLEANUP_CRON` environment variable
   - Verify server timezone settings
   - Check console logs for scheduler errors

2. **Leave types not being deleted**
   - Verify leave types are actually soft-deleted (`deleted_at` is set)
   - Check for active leave requests using the type
   - Review console logs for specific reasons

3. **Database errors**
   - Ensure all required tables exist
   - Check database permissions
   - Verify entity relationships

### **Debug Commands**
```javascript
// Check cleanup service status
const cleanupService = new LeaveTypeCleanupService(AppDataSource);

// Check specific leave type
const canDelete = await cleanupService.canPermanentlyDeleteLeaveType('123');
console.log('Can delete:', canDelete);

// Run manual cleanup
const results = await cleanupService.autoCleanupOrphanedLeaveTypes();
console.log('Cleanup results:', results);
```

## Best Practices

### **For Developers**
1. **Always use soft delete** for leave types
2. **Test cleanup logic** before production deployment
3. **Monitor cleanup logs** regularly
4. **Set appropriate timeouts** for cleanup operations

### **For Administrators**
1. **Review cleanup logs** daily
2. **Monitor database size** for orphaned records
3. **Test cleanup manually** before major changes
4. **Backup database** before cleanup operations

### **For Operations**
1. **Set up monitoring** for cleanup job failures
2. **Configure alerts** for cleanup errors
3. **Schedule maintenance windows** for cleanup operations
4. **Document cleanup procedures** for team reference

## Security Considerations

- **Admin-only access** to cleanup endpoints
- **Audit logging** of all deletion operations
- **Transaction safety** prevents partial deletions
- **Validation checks** ensure data integrity

## Performance Impact

- **Minimal overhead** - runs once daily at low-traffic time
- **Efficient queries** using database indexes
- **Batch processing** for multiple leave types
- **Configurable timing** to avoid peak usage

## Future Enhancements

1. **Bulk operations** for multiple leave types
2. **Configurable cleanup schedules** (weekly, monthly)
3. **Email notifications** for cleanup results
4. **Dashboard metrics** for cleanup statistics
5. **Rollback functionality** for accidental deletions

---

**Note**: This service is designed to be safe and non-destructive. It will never delete leave types that are still in use, ensuring data integrity while maintaining database performance.

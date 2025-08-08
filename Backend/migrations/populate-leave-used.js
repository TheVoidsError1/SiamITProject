// Backend/migrations/populate-leave-used.js
const { DataSource } = require('typeorm');
const config = require('../config');
const { calculateDaysBetween, convertToMinutes } = require('../utils/dateTimeUtils');

// Import entity schemas
const User = require('../EnityTable/user');
const LeaveType = require('../EnityTable/leaveType');
const LeaveRequest = require('../EnityTable/leaveRequest.entity');
const LeaveUsed = require('../EnityTable/leave_use');
const ProcessCheck = require('../EnityTable/ProcessCheck.entity');
const Admin = require('../EnityTable/admin');
const SuperAdmin = require('../EnityTable/superadmin');

async function populateLeaveUsed() {
  let AppDataSource;
  
  try {
    // Initialize database connection
    AppDataSource = new DataSource({
      type: 'mysql',
      host: config.database.host,
      port: config.database.port,
      username: config.database.username,
      password: config.database.password,
      database: config.database.database,
      entities: [User, LeaveType, LeaveRequest, LeaveUsed, ProcessCheck, Admin, SuperAdmin],
      synchronize: false,
      logging: false
    });

    await AppDataSource.initialize();
    console.log('Database connection established');

    const leaveRequestRepo = AppDataSource.getRepository('LeaveRequest');
    const leaveUsedRepo = AppDataSource.getRepository('LeaveUsed');
    const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
    const processCheckRepo = AppDataSource.getRepository('ProcessCheck');
    const userRepo = AppDataSource.getRepository('User');
    const adminRepo = AppDataSource.getRepository('Admin');
    const superAdminRepo = AppDataSource.getRepository('SuperAdmin');

    // Get all approved leave requests
    const approvedLeaves = await leaveRequestRepo.find({
      where: { status: 'approved' },
      order: { createdAt: 'ASC' }
    });

    console.log(`Found ${approvedLeaves.length} approved leave requests`);

    // Group by user and leave type
    const userLeaveMap = new Map();

    for (const leave of approvedLeaves) {
      // LeaveRequest.Repid directly contains the user ID
      const userId = leave.Repid;
      
      // Verify the user exists in one of the user tables
      const user = await userRepo.findOneBy({ id: userId });
      const admin = await adminRepo.findOneBy({ id: userId });
      const superAdmin = await superAdminRepo.findOneBy({ id: userId });

      if (!user && !admin && !superAdmin) {
        console.log(`Skipping leave request ${leave.id}: User not found in any user table (User ID: ${userId})`);
        continue;
      }

      const key = `${userId}_${leave.leaveType}`;
      
      if (!userLeaveMap.has(key)) {
        userLeaveMap.set(key, {
          user_id: userId,
          leave_type_id: leave.leaveType,
          days: 0,
          hours: 0
        });
      }

      const record = userLeaveMap.get(key);

      // Calculate days/hours based on leave type
      let leaveTypeEntity = null;
      if (leave.leaveType && leave.leaveType.length > 20) {
        leaveTypeEntity = await leaveTypeRepo.findOneBy({ id: leave.leaveType });
      } else {
        leaveTypeEntity = await leaveTypeRepo.findOne({
          where: [
            { leave_type_th: leave.leaveType },
            { leave_type_en: leave.leaveType }
          ]
        });
      }

      const isPersonalLeave = leaveTypeEntity && 
        (leaveTypeEntity.leave_type_en?.toLowerCase() === 'personal' || 
         leaveTypeEntity.leave_type_th === 'ลากิจ');

      if (isPersonalLeave && leave.startTime && leave.endTime) {
        // Hour-based calculation for personal leave
        try {
          const startMinutes = convertToMinutes(...leave.startTime.split(':').map(Number));
          const endMinutes = convertToMinutes(...leave.endTime.split(':').map(Number));
          let durationHours = (endMinutes - startMinutes) / 60;
          if (durationHours < 0 || isNaN(durationHours)) durationHours = 0;
          record.hours += durationHours;
        } catch (error) {
          console.error('Error calculating hours for leave:', leave.id, error);
        }
      } else if (leave.startDate && leave.endDate) {
        // Day-based calculation
        try {
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          let days = calculateDaysBetween(start, end);
          if (days < 0 || isNaN(days)) days = 0;
          record.days += days;
        } catch (error) {
          console.error('Error calculating days for leave:', leave.id, error);
        }
      }
    }

    // Insert records into LeaveUsed table
    let insertedCount = 0;
    let updatedCount = 0;

    for (const [key, record] of userLeaveMap) {
      try {
        // Check if record already exists
        const existingRecord = await leaveUsedRepo.findOne({
          where: { 
            user_id: record.user_id, 
            leave_type_id: record.leave_type_id 
          }
        });

        if (existingRecord) {
          // Update existing record
          existingRecord.days = (existingRecord.days || 0) + record.days;
          existingRecord.hour = (existingRecord.hour || 0) + record.hours;
          existingRecord.updated_at = new Date();
          await leaveUsedRepo.save(existingRecord);
          updatedCount++;
        } else {
          // Create new record
          const newRecord = leaveUsedRepo.create({
            user_id: record.user_id,
            leave_type_id: record.leave_type_id,
            days: record.days,
            hour: record.hours
          });
          await leaveUsedRepo.save(newRecord);
          insertedCount++;
        }
      } catch (error) {
        console.error('Error saving leave used record for key:', key, error);
      }
    }

    console.log(`Migration completed:`);
    console.log(`- Inserted: ${insertedCount} new records`);
    console.log(`- Updated: ${updatedCount} existing records`);
    console.log(`- Total processed: ${userLeaveMap.size} unique user-leave type combinations`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (AppDataSource && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  populateLeaveUsed()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = populateLeaveUsed;

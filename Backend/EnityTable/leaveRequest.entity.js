const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'LeaveRequest',
  tableName: 'leave_request',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    employeeType: { type: 'varchar' },
    leaveType: { type: 'varchar' },
    personalLeaveType: { type: 'varchar', nullable: true },
    startDate: { type: 'date' },
    endDate: { type: 'date' },
    startTime: { type: 'varchar', nullable: true },
    endTime: { type: 'varchar', nullable: true },
    reason: { type: 'text' },
    supervisor: { type: 'varchar', nullable: true },
    contact: { type: 'varchar', nullable: true },
    createdAt: { type: 'timestamp', createDate: true },
    imgLeave: { type: 'varchar', nullable: true },
    status: { type: 'varchar', nullable: true}
  }
});
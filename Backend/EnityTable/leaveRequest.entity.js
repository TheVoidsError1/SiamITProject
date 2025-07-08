const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'LeaveRequest',
  tableName: 'leave_request',
  columns: {
    id: {
      primary: true,
      type: 'varchar',
      length: 36,
      generated: 'uuid',
    },
    Repid: { type: 'varchar', nullable: true}, // Repid  ของ ProcessCheck เชื่อมกับ id ของ ProcessCheck
    employeeType: { type: 'varchar' },
    supervisor: { type: 'varchar', nullable: true } , // supervisor เชื่อมกับ id ของ admin
    leaveType: { type: 'varchar' },
    startDate: { type: 'date' },
    endDate: { type: 'date' },
    startTime: { type: 'varchar', nullable: true },
    endTime: { type: 'varchar', nullable: true },
    reason: { type: 'text' },
    rejectedReason: { type: 'text', nullable: true},
    contact: { type: 'varchar', nullable: true },
    createdAt: { type: 'timestamp', createDate: true },
    statusChangeTime: { type: 'timestamp', nullable: true},
    status: { type: 'varchar', nullable: true},
    statusBy: { type: 'varchar', nullable: true}, // status เชื่อมกับ id ของ admin
    approvedTime: { type: 'timestamp', nullable: true }, // เวลาที่อนุมัติ
    imgLeave: { type: 'varchar', nullable: true },
  },
});
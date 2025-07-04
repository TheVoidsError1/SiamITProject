const { EntitySchema } = require('typeorm');
const { v4: uuidv4 } = require('uuid');

module.exports = new EntitySchema({
  name: 'LeaveRequest',
  tableName: 'leave_request',
  columns: {
    id: {
      primary: true,
      type: 'varchar',
      length: 36,
    },
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
    status: { type: 'varchar', nullable: true},
    approvedTime: { type: 'timestamp', nullable: true},
    approvedBy: { type: 'varchar', nullable: true},
    rejectedReason: { type: 'text', nullable: true},
    Repid: { type: 'int', nullable: true} //ไอ้ Repid  ของ ProcessCheck
  },
  beforeInsert: (entity) => {
    if (!entity.id) {
      entity.id = uuidv4();
    }
  },
});
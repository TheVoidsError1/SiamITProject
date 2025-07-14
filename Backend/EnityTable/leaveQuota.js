const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'LeaveQuota',
  tableName: 'leave_quota',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    positionId: {
      type: 'varchar',
      nullable: false,
    },
    sick: {
      type: 'int',
      default: 0,
    },
    vacation: {
      type: 'int',
      default: 0,
    },
    personal: {
      type: 'int',
      default: 0,
    },
    maternity: {
      type: 'int',
      default: 0,
    },
  },
});

const { v4: uuidv4 } = require('uuid');
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'LeaveType',
    tableName: 'leave_type',
    columns: {
        id: { //ไอ้ id ของ LeaveType เชื่อมกับ leave_requst เขิงอมกับ id >>> leavetype
            primary: true,
            type: 'varchar',
            length: 36,
        },
        leave_type: { type: 'varchar' },
    },
    beforeInsert: (entity) => {
        if (!entity.id) {
            entity.id = uuidv4();
        }
    },
})
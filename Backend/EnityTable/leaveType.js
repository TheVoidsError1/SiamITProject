const { v4: uuidv4 } = require('uuid');
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'LeaveType',
    tableName: 'leave_type',
    columns: {
        id: {
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
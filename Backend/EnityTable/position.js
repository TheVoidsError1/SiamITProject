const { EntitySchema } = require('typeorm');
const { v4: uuidv4 } = require('uuid');

module.exports = new EntitySchema({
    name: 'Position',
    tableName: 'position',
    columns: {
        id: {
            primary: true,
            type: 'varchar',
            length: 36,
        },
        position_name: { type: 'varchar' },
    },
    beforeInsert: (entity) => {
        if (!entity.id) {
            entity.id = uuidv4();
        }
    },
})
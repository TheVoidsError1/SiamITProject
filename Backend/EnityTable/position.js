const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Position',
    tableName: 'position',
    columns: {
        id: {
            primary: true,
            type: 'varchar',
            length: 36,
            generated: 'uuid',
        },
        position_name: { type: 'varchar' },
    }
});
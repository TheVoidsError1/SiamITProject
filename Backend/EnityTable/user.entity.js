const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'User',
    tableName: 'user',
    columns: {
        id: {
            primary: true,
            type: 'varchar',
            length: 36,
            generated: 'uuid',
        },
        // ... other columns ...
    },
}); 
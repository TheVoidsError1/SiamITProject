const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Admin',
    tableName: 'admin',
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
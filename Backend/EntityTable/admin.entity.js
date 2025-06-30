const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'admin',
    tableName: 'admin',
    columns: {
      admin_id: {
        primary: true,
        type: 'int',
        generated: true,
      },
      admin_name: {
        type: 'varchar',
      },
    },
  }); 
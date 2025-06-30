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
      firstname: {
        type: 'varchar',
      },
      lastname: {
        type: 'varchar',
        unique: true,
      },
    },
  }); 
const { EntitySchema } = require('typeorm');
const { v4: uuidv4 } = require('uuid');

module.exports = new EntitySchema({
    name: 'SuperAdmin',
    tableName: 'superadmin',
    columns: {
      id: {
        primary: true,
        type: 'varchar',
        length: 36,
        generated: 'uuid',
      },
      superadmin_name: {
        type: 'varchar',
        unique: true,
      },
      department: {
        type: 'varchar',
      },
      position: {
        type: 'varchar',
      },
    },
  }); 
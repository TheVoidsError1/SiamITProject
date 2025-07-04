const { EntitySchema } = require('typeorm');
const { v4: uuidv4 } = require('uuid');

module.exports = new EntitySchema({
    name: 'admin',
    tableName: 'admin',
    columns: {
      id: {
        primary: true,
        type: 'varchar',
        length: 36,
        generated: 'uuid',
      },
      admin_name: {
        type: 'varchar',
      },
      department: {
        type: 'varchar',
      },
      position: {
        type: 'varchar',
      },
    },
  }); 
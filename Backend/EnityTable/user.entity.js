const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    User_id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    User_name: {
      type: 'varchar',
    },
    position: {
      type: 'varchar',
    },
    department: {
      type: 'varchar',
     },
},
}); 
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
    firstname: {
      type: 'varchar',
    },
    lastname: {
      type: 'varchar',
      unique: true,
    },
    position: {
      type: 'varchar',
    },
    department: {
      type: 'varchar',
     },
  
},
}); 
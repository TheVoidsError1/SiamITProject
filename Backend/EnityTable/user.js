const { EntitySchema } = require('typeorm');
const { v4: uuidv4 } = require('uuid');

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      primary: true,
      type: 'varchar',
      length: 36,
      generated: 'uuid',
    },
    User_name: {
      type: 'varchar',
      unique: true,
     },
     department: {
      type: 'varchar',
     },
     position: {
      type: 'varchar',
     },
     avatar: {
      type: 'varchar',
      nullable: true,
     },
  },
}); 
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'ProcessCheck',
  tableName: 'process_check',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    Email: { type: 'varchar' },
    Password: { type: 'varchar' },
    Token: { type: 'varchar' , default: null}, 
    Role: { type: 'varchar'},
    Repid: { type: 'int', nullable: true },
    avatar_url: { type: 'varchar' }
  },
});
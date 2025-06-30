const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'ProcessCheck',
  tableName: 'process_check',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    Email: { type: 'varchar' },
    Password: { type: 'varchar' },
    Token: { type: 'varchar' },
    Role: { type: 'varchar', default: 'user' },
  },
});
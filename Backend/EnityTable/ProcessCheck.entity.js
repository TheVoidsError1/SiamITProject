const { EntitySchema } = require('typeorm');
const { v4: uuidv4 } = require('uuid');

module.exports = new EntitySchema({
  name: 'ProcessCheck',
  tableName: 'process_check',
  columns: {
    id: {
      primary: true,
      type: 'varchar',
      length: 36,
      generated: 'uuid',
    },
    Email: { type: 'varchar' },
    Password: { type: 'varchar' },
    Token: { type: 'varchar', default: null },
    Role: { type: 'varchar', default: 'user' },
    Repid: { type: 'varchar', length: 36, nullable: true }, // Repid เชื่อมกับ id user & admin
    avatar_url: { type: 'varchar', default: null }
  },
});
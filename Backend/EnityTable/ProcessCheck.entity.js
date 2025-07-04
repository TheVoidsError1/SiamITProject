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
    },
    Email: { type: 'varchar' },
    Password: { type: 'varchar' },
    Token: { type: 'varchar', default: null },
    Role: { type: 'varchar', default: 'user' },
    Repid: { type: 'varchar', length: 36, nullable: true },
    avatar_url: { type: 'varchar', default: null }
  },
  beforeInsert: (entity) => {
    if (!entity.id) {
      entity.id = uuidv4();
    }
  },
});
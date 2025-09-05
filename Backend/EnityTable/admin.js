const { EntitySchema } = require('typeorm');
const { v4: uuidv4 } = require('uuid');

module.exports = new EntitySchema({
    name: 'Admin',
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
        unique: true,
      },
      department: {
        type: 'varchar',
        nullable: true,
      },
      position: {
        type: 'varchar',
        nullable: true,
      },
      gender: {
        type: 'varchar',
        nullable: true,
      },
      dob: {
        type: 'date',
        nullable: true,
      },
      phone_number: {
        type: 'varchar',
        nullable: true
      },
      start_work: {
        type: 'date',
        nullable: true,
      },
      end_work: {
        type: 'date',
        nullable: true,
      },
    },
  }); 
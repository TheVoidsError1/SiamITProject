// Backend/migrations/recreate-leave-used-table.js
const { DataSource } = require('typeorm');
const config = require('../config');
const LeaveUsed = require('../EnityTable/leave_use');

async function recreateLeaveUsedTable() {
  let AppDataSource;
  
  try {
    // Initialize database connection
    AppDataSource = new DataSource({
      type: 'mysql',
      host: config.database.host,
      port: config.database.port,
      username: config.database.username,
      password: config.database.password,
      database: config.database.database,
      entities: [LeaveUsed],
      synchronize: false,
      logging: true
    });

    await AppDataSource.initialize();
    console.log('Database connection established');

    // Drop the existing table
    console.log('Dropping existing leave_used table...');
    await AppDataSource.query('DROP TABLE IF EXISTS `leave_used`');

    // Create the table without foreign key constraints
    console.log('Creating new leave_used table...');
    await AppDataSource.query(`
      CREATE TABLE \`leave_used\` (
        \`id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        \`leave_type_id\` varchar(255) NOT NULL,
        \`days\` int DEFAULT 0,
        \`hour\` int DEFAULT 0,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_leave_type_id\` (\`leave_type_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('leave_used table recreated successfully without foreign key constraints');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (AppDataSource && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  recreateLeaveUsedTable()
    .then(() => {
      console.log('Table recreation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Table recreation failed:', error);
      process.exit(1);
    });
}

module.exports = recreateLeaveUsedTable;

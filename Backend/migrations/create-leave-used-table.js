const mysql = require('mysql2/promise');
const config = require('../config');

async function createLeaveUsedTable() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.database,
    });

    console.log('Connected to database successfully');

    // Create leave_used table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS leave_used (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        leave_type VARCHAR(255) NOT NULL,
        days INT DEFAULT 0,
        hour INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        
        INDEX idx_user_id (user_id),
        INDEX idx_leave_type (leave_type),
        INDEX idx_created_at (created_at)
      )
    `;

    console.log('Creating leave_used table...');
    await connection.execute(createTableQuery);
    console.log('✓ leave_used table created successfully');

    // Verify table structure
    const [columns] = await connection.execute('DESCRIBE leave_used');
    console.log('\nTable structure:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    console.log('\n🎉 leave_used table migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  createLeaveUsedTable();
}

module.exports = createLeaveUsedTable;

const mysql = require('mysql2/promise');
const config = require('../config');

async function runMigration() {
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

    // Migration queries
    const migrations = [
      // 1. Add new_year_quota to position table
      "ALTER TABLE position ADD COLUMN new_year_quota INT DEFAULT 0",
      
      // 2. Update users table
      "ALTER TABLE users DROP COLUMN avatar",
      "ALTER TABLE users ADD COLUMN gender VARCHAR(255) NULL",
      "ALTER TABLE users ADD COLUMN dob DATE NULL",
      "ALTER TABLE users ADD COLUMN phone_number VARCHAR(255) NULL",
      "ALTER TABLE users ADD COLUMN start_work DATE NULL",
      "ALTER TABLE users ADD COLUMN end_work DATE NULL",
      
      // 3. Update admin table
      "ALTER TABLE admin DROP COLUMN avatar",
      "ALTER TABLE admin ADD COLUMN gender VARCHAR(255) NULL",
      "ALTER TABLE admin ADD COLUMN dob DATE NULL",
      "ALTER TABLE admin ADD COLUMN phone_number VARCHAR(255) NULL",
      "ALTER TABLE admin ADD COLUMN start_work DATE NULL",
      "ALTER TABLE admin ADD COLUMN end_work DATE NULL",
      
      // 4. Update superadmin table
      "ALTER TABLE superadmin DROP COLUMN avatar",
      "ALTER TABLE superadmin ADD COLUMN gender VARCHAR(255) NULL",
      "ALTER TABLE superadmin ADD COLUMN dob DATE NULL",
      "ALTER TABLE superadmin ADD COLUMN phone_number VARCHAR(255) NULL",
      "ALTER TABLE superadmin ADD COLUMN start_work DATE NULL",
      "ALTER TABLE superadmin ADD COLUMN end_work DATE NULL"
    ];

    // Execute each migration
    for (let i = 0; i < migrations.length; i++) {
      const query = migrations[i];
      console.log(`Executing migration ${i + 1}/${migrations.length}: ${query}`);
      
      try {
        await connection.execute(query);
        console.log(`✓ Migration ${i + 1} completed successfully`);
      } catch (error) {
        // Check if it's a "column doesn't exist" error (for DROP COLUMN)
        if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY' && query.includes('DROP COLUMN avatar')) {
          console.log(`⚠ Migration ${i + 1}: avatar column already removed, skipping`);
        } else if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠ Migration ${i + 1}: column already exists, skipping`);
        } else {
          console.error(`✗ Migration ${i + 1} failed:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
    
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
  runMigration();
}

module.exports = runMigration;

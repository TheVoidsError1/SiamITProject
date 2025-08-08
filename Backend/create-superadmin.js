const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import entities
const SuperAdmin = require('./EnityTable/superadmin.js');
const ProcessCheck = require('./EnityTable/ProcessCheck.entity.js');
const Department = require('./EnityTable/department.js');
const Position = require('./EnityTable/position.js');

// Database configuration
const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'siamitleave',
    type: process.env.DB_TYPE || 'mysql',
  },
  server: {
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_here',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  }
};

// Generate random Gmail
function generateRandomGmail() {
  const adjectives = ['super', 'admin', 'power', 'master', 'chief', 'boss', 'leader', 'director', 'manager', 'head'];
  const nouns = ['admin', 'user', 'account', 'profile', 'system', 'control', 'manage', 'supervisor', 'coordinator', 'officer'];
  const numbers = Math.floor(Math.random() * 1000);
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}.${noun}.${numbers}@gmail.com`;
}

// Generate random password
function generateRandomPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Create DataSource
const AppDataSource = new DataSource({
  type: config.database.type,
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: false,
  logging: false,
  entities: [SuperAdmin, ProcessCheck, Department, Position],
});

async function createSuperAdmin() {
  try {
    // Initialize DataSource
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Generate random credentials
    const email = generateRandomGmail();
    const password = generateRandomPassword();
    const superadminName = `SuperAdmin_${Math.floor(Math.random() * 1000)}`;

    console.log('\n🎯 Generated SuperAdmin Credentials:');
    console.log('=====================================');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Name: ${superadminName}`);
    console.log('=====================================\n');

    // Check if email already exists
    const processRepo = AppDataSource.getRepository('ProcessCheck');
    const existingEmail = await processRepo.findOneBy({ Email: email });
    if (existingEmail) {
      console.log('❌ Email already exists, generating new one...');
      return createSuperAdmin();
    }

    // Check if superadmin name already exists
    const superadminRepo = AppDataSource.getRepository('SuperAdmin');
    const existingName = await superadminRepo.findOneBy({ superadmin_name: superadminName });
    if (existingName) {
      console.log('❌ SuperAdmin name already exists, generating new one...');
      return createSuperAdmin();
    }

    // Get or create default department
    const departmentRepo = AppDataSource.getRepository('Department');
    let defaultDepartment = await departmentRepo.findOne({ where: { department_name_th: 'IT' } });
    if (!defaultDepartment) {
      defaultDepartment = departmentRepo.create({
        id: uuidv4(),
        department_name_en: 'Information Technology',
        department_name_th: 'IT'
      });
      await departmentRepo.save(defaultDepartment);
      console.log('✅ Default department created');
    }

    // Get or create default position
    const positionRepo = AppDataSource.getRepository('Position');
    let defaultPosition = await positionRepo.findOne({ where: { position_name_th: 'Super Admin' } });
    if (!defaultPosition) {
      defaultPosition = positionRepo.create({
        id: uuidv4(),
        position_name_en: 'Super Administrator',
        position_name_th: 'Super Admin'
      });
      await positionRepo.save(defaultPosition);
      console.log('✅ Default position created');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create superadmin
    const superadminId = uuidv4();
    const superadmin = superadminRepo.create({
      id: superadminId,
      superadmin_name: superadminName,
      department: defaultDepartment.id,
      position: defaultPosition.id,
      gender: null,
      dob: null,
      phone_number: null,
      start_work: null,
      end_work: null
    });

    await superadminRepo.save(superadmin);
    console.log('✅ SuperAdmin created successfully');

    // Create JWT Token
    const token = jwt.sign(
      { userId: superadminId, email: email },
      config.server.jwtSecret,
      { expiresIn: config.server.jwtExpiresIn }
    );

    // Create process_check entry
    const processCheck = processRepo.create({
      id: uuidv4(),
      Email: email,
      Password: hashedPassword,
      Token: token,
      Repid: superadminId,
      Role: 'superadmin',
      avatar_url: null
    });

    await processRepo.save(processCheck);
    console.log('✅ ProcessCheck entry created successfully');

    console.log('\n🎉 SuperAdmin Account Created Successfully!');
    console.log('===========================================');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Name: ${superadminName}`);
    console.log(`🆔 ID: ${superadminId}`);
    console.log(`🔐 Role: superadmin`);
    console.log(`🏢 Department: ${defaultDepartment.department_name_th}`);
    console.log(`💼 Position: ${defaultPosition.position_name_th}`);
    console.log('===========================================');
    console.log('\n💡 Please save these credentials securely!');
    console.log('🚀 You can now login with these credentials.');

  } catch (error) {
    console.error('❌ Error creating SuperAdmin:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('🔄 Duplicate entry found, retrying...');
      return createSuperAdmin();
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  createSuperAdmin();
}

module.exports = { createSuperAdmin, generateRandomGmail, generateRandomPassword };

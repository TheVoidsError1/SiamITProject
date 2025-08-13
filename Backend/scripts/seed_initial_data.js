require('dotenv').config(); //node scripts/seed_initial_data.js run แบบนี้น่ะ
require('reflect-metadata');
const { DataSource } = require('typeorm');
const config = require('../config');

const entities = [
  require('../EnityTable/user.js'),
  require('../EnityTable/ProcessCheck.entity.js'),
  require('../EnityTable/admin.js'),
  require('../EnityTable/superadmin.js'),
  require('../EnityTable/leaveRequest.entity.js'),
  require('../EnityTable/position.js'),
  require('../EnityTable/leaveType.js'),
  require('../EnityTable/department.js'),
  require('../EnityTable/leaveQuota.js'),
  require('../EnityTable/announcements.js'),
  require('../EnityTable/customHoliday.js'),
  require('../EnityTable/leave_use.js'),
];

const AppDataSource = new DataSource({
  type: config.database.type,
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: true,
  logging: false,
  entities,
});

async function upsertDepartment(repo, en, th) {
  const exist = await repo.findOne({
    where: [
      { department_name_en: en },
      { department_name_th: th },
    ],
  });
  if (exist) return false;
  await repo.save(repo.create({ department_name_en: en, department_name_th: th }));
  return true;
}

async function upsertPosition(repo, en, th) {
  const exist = await repo.findOne({
    where: [
      { position_name_en: en },
      { position_name_th: th },
    ],
  });
  if (exist) return false;
  await repo.save(repo.create({ position_name_en: en, position_name_th: th }));
  return true;
}

async function upsertLeaveType(repo, en, th) {
  const exist = await repo.findOne({
    where: [
      { leave_type_en: en },
      { leave_type_th: th },
    ],
  });
  if (exist) return false;
  await repo.save(repo.create({ leave_type_en: en, leave_type_th: th }));
  return true;
}

async function seed() {
  await AppDataSource.initialize();
  const departmentRepo = AppDataSource.getRepository('Department');
  const positionRepo = AppDataSource.getRepository('Position');
  const leaveTypeRepo = AppDataSource.getRepository('LeaveType');

  const departments = [
    ['Finance', 'การเงิน'],
    ['Marketing', 'การตลาด'],
    ['Sales', 'ฝ่ายขาย'],
    ['Human Resources', 'ทรัพยากรบุคคล'],
    ['Customer Service', 'บริการลูกค้า'],
    ['Operations', 'ฝ่ายปฏิบัติการ'],
    ['IT Department', 'แผนกไอที'],
    ['No Department', 'ไม่มีแผนก'],
  ];

  const positions = [
    ['Intern', 'นักศึกษาฝึกงาน'],
    ['Employee', 'พนักงาน'],
    ['No Position', 'ไม่มีตำแหน่ง'],
  ];

  const leaveTypes = [
    ['Sick', 'ลาป่วย'],
    ['Vacation', 'ลาพักร้อน'],
    ['Personal', 'ลากิจ'],
    ['Maternity', 'ลาคลอด'],
    ['Emergency', 'ลาฉุกเฉิน'],
  ];

  let depAdded = 0;
  for (const [en, th] of departments) {
    if (await upsertDepartment(departmentRepo, en, th)) depAdded += 1;
  }

  let posAdded = 0;
  for (const [en, th] of positions) {
    if (await upsertPosition(positionRepo, en, th)) posAdded += 1;
  }

  let ltAdded = 0;
  for (const [en, th] of leaveTypes) {
    if (await upsertLeaveType(leaveTypeRepo, en, th)) ltAdded += 1;
  }

  console.log('Seeding completed:', { departmentsInserted: depAdded, positionsInserted: posAdded, leaveTypesInserted: ltAdded });
  await AppDataSource.destroy();
}

seed().catch(async (err) => {
  console.error('Seeding failed:', err);
  try { await AppDataSource.destroy(); } catch (_) {}
  process.exit(1);
});



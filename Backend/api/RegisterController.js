const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { BaseController, sendSuccess, sendError, sendValidationError } = require('../utils');

module.exports = (AppDataSource) => {
  const router = require('express').Router();
  // Create base controller instances
  const userController = new BaseController('User');
  const departmentController = new BaseController('Department');
  const positionController = new BaseController('Position');

  router.post('/register', async (req, res) => {
    try {
      const { name, department, position, email, password, gender, dob, phone_number, start_work, end_work } = req.body;
      const userRepo = AppDataSource.getRepository('User');
      const processRepo = AppDataSource.getRepository('User');
      const departmentRepo = AppDataSource.getRepository('Department');
      const positionRepo = AppDataSource.getRepository('Position');

      // ตรวจสอบชื่อซ้ำ
      const nameExist = await userRepo.findOneBy({ name });
      if (nameExist) {
        return sendValidationError(res, 'ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว');
      }

      // ตรวจสอบ email ซ้ำ
      const exist = await processRepo.findOneBy({ Email: email });
      if (exist) {
        return sendValidationError(res, 'Email นี้ถูกใช้ไปแล้ว');
      }

      // แปลง department id เป็น entity
      let departmentId = null;
      if (department) {
        const deptEntity = await departmentController.findOne(AppDataSource, department);
        if (!deptEntity) {
          return sendValidationError(res, 'Department not found');
        }
        departmentId = deptEntity.id;
      }

      // แปลง position id เป็น entity
      let positionId = null;
      if (position) {
        const posEntity = await positionController.findOne(AppDataSource, position);
        if (!posEntity) {
          return sendValidationError(res, 'Position not found');
        }
        positionId = posEntity.id;
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // สร้าง JWT Token
      const userId = uuidv4();
      const token = jwt.sign(
        { userId: userId, email: email },
        config.server.jwtSecret,
        { expiresIn: config.server.jwtExpiresIn }
      );

      // สร้าง user ใน unified users table (single row with all data)
      const user = processRepo.create({
        id: userId,
        name,
        Email: email,
        Password: hashedPassword,
        Token: token,
        Role: 'user',
        department: departmentId,
        position: positionId,
        gender: gender || null,
        dob: dob || null,
        phone_number: phone_number || null,
        start_work: start_work || null,
        end_work: end_work || null,
        avatar_url: null
      });
      await processRepo.save(user);

      sendSuccess(res, { ...user, token, repid: user.id }, 'Register successful', 201);
    } catch (err) {
      // Handle unique constraint errors
      if (err.code === 'ER_DUP_ENTRY' && err.message.includes('Email')) {
        return sendValidationError(res, 'Email นี้ถูกใช้ไปแล้ว');
      }
      if (err.code === 'ER_DUP_ENTRY' && err.message.includes('name')) {
        return sendValidationError(res, 'ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว');
      }
      sendError(res, err.message, 500);
    }
  });

  // หมายเหตุ: เส้นทาง /departments และ /positions ถูกย้ายให้ใช้ที่ DepartmentController/PositionController เท่านั้น
  // เพื่อลดความซ้ำซ้อนและให้โครงสร้างข้อมูลสอดคล้องกันทั้งระบบ

  return router;
};
// เหตุผล: ต้องสร้าง user ก่อนเพื่อให้ได้ user.id แล้วจึงนำ user.id ไปใส่ Repid ใน process_check และบันทึก Token พร้อมกัน เพื่อให้ข้อมูลสัมพันธ์กันและปลอดภัย
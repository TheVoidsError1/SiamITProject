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
      const { User_name, department, position, email, password } = req.body;
      const userRepo = AppDataSource.getRepository('User');
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const departmentRepo = AppDataSource.getRepository('Department');
      const positionRepo = AppDataSource.getRepository('Position');

      // ตรวจสอบชื่อซ้ำ
      const nameExist = await userRepo.findOneBy({ User_name });
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

      // สร้าง user ก่อน เพื่อให้ได้ user.id
      const user = await userController.create(AppDataSource, {
        id: uuidv4(),
        User_name,
        department: departmentId,
        position: positionId
      });

      // สร้าง JWT Token
      const token = jwt.sign(
        { userId: user.id, email: email },
        config.server.jwtSecret,
        { expiresIn: config.server.jwtExpiresIn }
      );

      // สร้าง process_check พร้อม Token และ Repid
      const processCheck = processRepo.create({
        id: uuidv4(),
        Email: email,
        Password: hashedPassword,
        Token: token,
        Repid: user.id,
        Role: 'user',
        avatar_url: null
      });
      await processRepo.save(processCheck);

      sendSuccess(res, { ...user, token, repid: user.id }, 'Register successful', 201);
    } catch (err) {
      // Handle unique constraint errors
      if (err.code === 'ER_DUP_ENTRY' && err.message.includes('Email')) {
        return sendValidationError(res, 'Email นี้ถูกใช้ไปแล้ว');
      }
      if (err.code === 'ER_DUP_ENTRY' && err.message.includes('User_name')) {
        return sendValidationError(res, 'ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว');
      }
      sendError(res, err.message, 500);
    }
  });

  // ดึงข้อมูล department ทั้งหมด
  router.get('/departments', async (req, res) => {
    try {
      const departments = await departmentController.findAll(AppDataSource);
      sendSuccess(res, departments, 'ดึงข้อมูล department สำเร็จ');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  });

  // ดึงข้อมูล position ทั้งหมด
  router.get('/positions', async (req, res) => {
    try {
      const positions = await positionController.findAll(AppDataSource);
      sendSuccess(res, positions, 'ดึงข้อมูล position สำเร็จ');
    } catch (err) {
      sendError(res, err.message, 500);
    }
  });

  // เพิ่ม department
  router.post('/departments', async (req, res) => {
    try {
      const { department } = req.body;
      const newDept = await departmentController.create(AppDataSource, { department_name_th: department });
      sendSuccess(res, newDept, 'เพิ่ม department สำเร็จ', 201);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  });

  // เพิ่ม position
  router.post('/positions', async (req, res) => {
    try {
      const { position } = req.body;
      const newPos = await positionController.create(AppDataSource, { position_name_th: position });
      sendSuccess(res, newPos, 'เพิ่ม position สำเร็จ', 201);
    } catch (err) {
      sendError(res, err.message, 500);
    }
  });

  return router;
};
// เหตุผล: ต้องสร้าง user ก่อนเพื่อให้ได้ user.id แล้วจึงนำ user.id ไปใส่ Repid ใน process_check และบันทึก Token พร้อมกัน เพื่อให้ข้อมูลสัมพันธ์กันและปลอดภัย
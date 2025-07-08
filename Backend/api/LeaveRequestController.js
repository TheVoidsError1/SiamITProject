   // Backend/api/LeaveRequestController.js
   const express = require('express');
   const multer = require('multer');
   const path = require('path');
   const fs = require('fs');
   const jwt = require('jsonwebtoken');
   const SECRET = 'your_secret_key';

   // ตั้งค่าที่เก็บไฟล์
   const storage = multer.diskStorage({
     destination: function (req, file, cb) {
       const uploadPath = path.join(__dirname, '../../public/leave-uploads');
       if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
       cb(null, uploadPath);
     },
     filename: function (req, file, cb) {
       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
       cb(null, uniqueSuffix + path.extname(file.originalname));
     }
   });
   const upload = multer({ storage: storage });

   module.exports = (AppDataSource) => {
     const router = express.Router();

     // POST /api/leave-request
     router.post('/', upload.single('imgLeave'), async (req, res) => {
       try {
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         let userId = null;
         // ดึง userId จาก JWT
         const authHeader = req.headers.authorization;
         if (authHeader && authHeader.startsWith('Bearer ')) {
           const token = authHeader.split(' ')[1];
           const decoded = jwt.verify(token, SECRET);
           userId = decoded.userId;
         }
         const {
           employeeType, leaveType, personalLeaveType, startDate, endDate,
           startTime, endTime, reason, supervisor, contact
         } = req.body;

         const leaveData = {
           Repid: userId, // ใส่ user_id จาก JWT
           employeeType,
           leaveType,
           startDate,
           endDate,
           startTime,
           endTime,
           reason,
           supervisor,
           contact,
           imgLeave: req.file ? req.file.filename : null,
           status: 'pending',
         };

         // เพิ่มข้อมูลลงฐานข้อมูล
         const leave = leaveRepo.create(leaveData);
         await leaveRepo.save(leave);

         res.status(201).json({ status: 'success', data: leave, message: 'Leave request created' });
       } catch (err) {
         res.status(500).json({ status: 'error', message: err.message });
       }
     });

     // GET /api/leave-request/pending
     router.get('/pending', async (req, res) => {
       try {
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const userRepo = AppDataSource.getRepository('User');
         const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
         // ดึง leave requests ที่ pending
         const pendingLeaves = await leaveRepo.find({
           where: { status: 'pending' },
           order: { id: 'DESC' },
         });
         // join user (Repid -> user.id) และ leaveType (leaveType -> LeaveType.id)
         const result = await Promise.all(pendingLeaves.map(async (leave) => {
           let user = null;
           let leaveTypeObj = null;
           if (leave.Repid) {
             user = await userRepo.findOneBy({ id: leave.Repid });
           }
           if (leave.leaveType) {
             leaveTypeObj = await leaveTypeRepo.findOneBy({ id: leave.leaveType });
           }
           return {
             ...leave,
             user: user ? { User_name: user.User_name, department: user.department, position: user.position } : null,
             leaveTypeName: leaveTypeObj ? leaveTypeObj.leave_type : leave.leaveType,
           };
         }));
         res.json({ status: 'success', data: result });
       } catch (err) {
         res.status(500).json({ status: 'error', message: err.message });
       }
     });
     return router;
   };
   // Backend/api/LeaveRequestController.js
   const express = require('express');
   const multer = require('multer');
   const path = require('path');
   const fs = require('fs');
   const jwt = require('jsonwebtoken');
   const SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
         let role = null;
         // ดึง userId จาก JWT
         const authHeader = req.headers.authorization;
         if (authHeader && authHeader.startsWith('Bearer ')) {
           const token = authHeader.split(' ')[1];
           try {
             const decoded = jwt.verify(token, SECRET);
             userId = decoded.userId;
             role = decoded.role;
           } catch (err) {
             return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
           }
         }
         // ดึงตำแหน่งจาก user หรือ admin
         let employeeType = null;
         if (userId) {
           if (role === 'admin') {
             const adminRepo = AppDataSource.getRepository('Admin');
             const admin = await adminRepo.findOneBy({ id: userId });
             employeeType = admin ? admin.position : null;
           } else {
             const userRepo = AppDataSource.getRepository('User');
             const user = await userRepo.findOneBy({ id: userId });
             employeeType = user ? user.position : null;
           }
         }
         const {
           /* employeeType, */ leaveType, personalLeaveType, startDate, endDate,
           startTime, endTime, reason, supervisor, contact
         } = req.body;

         // ตรวจสอบภาษา
         const lang = (req.headers['accept-language'] || '').toLowerCase().startsWith('en') ? 'en' : 'th';

         // ฟังก์ชันตรวจสอบเวลาในช่วง 09:00-18:00
         function isTimeInRange(timeStr) {
           if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) return false;
           const [h, m] = timeStr.split(':').map(Number);
           const minutes = h * 60 + m;
           return minutes >= 9 * 60 && minutes <= 18 * 60;
         }
         // ตรวจสอบเฉพาะกรณีมี startTime/endTime
         if (startTime && endTime) {
           if (startTime === endTime) {
             return res.status(400).json({
               status: 'error',
               message: lang === 'en' ? 'Start time and end time must not be the same.' : 'เวลาเริ่มต้นและเวลาสิ้นสุดต้องไม่เหมือนกัน'
             });
           }
           if (!isTimeInRange(startTime) || !isTimeInRange(endTime)) {
             return res.status(400).json({
               status: 'error',
               message: lang === 'en'
                 ? 'You can request leave only during working hours: 09:00 to 18:00.'
                 : 'สามารถลาได้เฉพาะช่วงเวลาทำงาน 09:00 ถึง 18:00 เท่านั้น'
             });
           }
         }

         const leaveData = {
           Repid: userId, // ใส่ user_id จาก JWT
           employeeType, // ดึงจาก user.position
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
             if (!user) {
               // ถ้าไม่เจอใน user ให้ลองหาใน admin
               const adminRepo = AppDataSource.getRepository('Admin');
               const admin = await adminRepo.findOneBy({ id: leave.Repid });
               if (admin) {
                 user = { User_name: admin.admin_name, department: admin.department, position: admin.position };
               }
             }
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

     // GET /api/leave-request/history
     router.get('/history', async (req, res) => {
       try {
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const userRepo = AppDataSource.getRepository('User');
         const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
         const adminRepo = AppDataSource.getRepository('Admin');
         // รับ userId จาก query param (optional)
         const { userId } = req.query;
         let where = [
           { status: 'approved' },
           { status: 'rejected' },
           { status: 'pending' }
         ];
         // ถ้ามี userId ให้ filter ตาม userId
         if (userId) {
           where = [
             { status: 'approved', Repid: userId },
             { status: 'rejected', Repid: userId },
             { status: 'pending', Repid: userId }
           ];
         }
         // ดึงใบคำขอที่ status เป็น approved หรือ rejected (และ filter ตาม userId ถ้ามี)
         const processedLeaves = await leaveRepo.find({
           where,
           order: { id: 'DESC' },
         });
         const result = await Promise.all(processedLeaves.map(async (leave) => {
           let user = null;
           let leaveTypeObj = null;
           if (leave.Repid) {
             user = await userRepo.findOneBy({ id: leave.Repid });
             if (!user) {
               // ถ้าไม่เจอใน user ให้ลองหาใน admin
               const admin = await adminRepo.findOneBy({ id: leave.Repid });
               if (admin) {
                 user = { User_name: admin.admin_name, department: admin.department, position: admin.position };
               }
             }
           }
           // join leaveType จาก database
           if (leave.leaveType) leaveTypeObj = await leaveTypeRepo.findOneBy({ id: leave.leaveType });
           // คำนวณจำนวนวันหรือชั่วโมงลา
           let duration = '';
           let durationType = '';
           if (leave.startTime && leave.endTime) {
             // Calculate hours
             const [sh, sm] = leave.startTime.split(':').map(Number);
             const [eh, em] = leave.endTime.split(':').map(Number);
             let start = sh + (sm || 0) / 60;
             let end = eh + (em || 0) / 60;
             let diff = end - start;
             if (diff < 0) diff += 24; // ข้ามวัน
             duration = diff.toFixed(2);
             durationType = 'hour';
           } else if (leave.startDate && leave.endDate) {
             const start = new Date(leave.startDate);
             const end = new Date(leave.endDate);
             duration = Math.abs((end - start) / (1000*60*60*24)) + 1;
             durationType = 'day';
           }
           return {
             id: leave.id,
             leaveTypeName: leaveTypeObj ? leaveTypeObj.leave_type : leave.leaveType,
             leaveDate: leave.startDate,
             startDate: leave.startDate,
             endDate: leave.endDate,
             startTime: leave.startTime || null,
             endTime: leave.endTime || null,
             approvedTime: leave.approvedTime,
             rejectedTime: leave.rejectedTime,
             createdAt: leave.createdAt,
             duration,
             durationType,
             reason: leave.reason,
             status: leave.status,
             submittedDate: leave.createdAt,
             user: user ? { User_name: user.User_name, department: user.department, position: user.position } : null,
           };
         }));
         res.json({ status: 'success', data: result });
       } catch (err) {
         res.status(500).json({ status: 'error', message: err.message });
       }
     });

     // GET /api/leave-request/dashboard-stats
     router.get('/dashboard-stats', async (req, res) => {
       try {
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         // 1. Pending count
         const pendingCount = await leaveRepo.count({ where: { status: 'pending' } });
         // 2. Approved count (นับจำนวนใบลาที่ status = 'approved')
         const approvedCount = await leaveRepo.count({ where: { status: 'approved' } });
         // 3. User count (unique Repid in leave requests)
         const allLeaves = await leaveRepo.find();
         const userIds = Array.from(new Set(allLeaves.map(l => l.Repid)));
         const userCount = userIds.length;
         // 4. Average leave days (เฉพาะที่อนุมัติ)
         const approvedLeaves = allLeaves.filter(l => l.status === 'approved');
         let averageDayOff = 0;
         if (approvedLeaves.length > 0) {
           const totalDays = approvedLeaves.reduce((sum, l) => {
             const start = l.startDate ? new Date(l.startDate) : null;
             const end = l.endDate ? new Date(l.endDate) : null;
             if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
               return sum + ((end.getTime() - start.getTime()) / (1000*60*60*24) + 1);
             }
             return sum;
           }, 0);
           averageDayOff = parseFloat((totalDays / approvedLeaves.length).toFixed(1));
         }
         res.json({
           status: 'success',
           data: {
             pendingCount,
             approvedCount,
             userCount,
             averageDayOff
           }
         });
       } catch (err) {
         res.status(500).json({ status: 'error', message: err.message });
       }
     });

     // GET /api/leave-request/my - Get all leave requests for the logged-in user
     router.get('/my', async (req, res) => {
       try {
         const authHeader = req.headers.authorization;
         if (!authHeader || !authHeader.startsWith('Bearer ')) {
           return res.status(401).json({ status: 'error', message: 'No token provided' });
         }
         const token = authHeader.split(' ')[1];
         const decoded = jwt.verify(token, SECRET);
         const userId = decoded.userId;

         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
         const leaves = await leaveRepo.find({ where: { Repid: userId }, order: { createdAt: 'DESC' } });

         // Map to required fields, with leave type name
         const result = await Promise.all(leaves.map(async l => {
           let leaveTypeName = l.leaveType;
           if (l.leaveType) {
             const leaveTypeObj = await leaveTypeRepo.findOneBy({ id: l.leaveType });
             if (leaveTypeObj) leaveTypeName = leaveTypeObj.leave_type;
           }
           // Calculate duration
           let duration = '';
           let durationType = '';
           if (l.startTime && l.endTime) {
             // Calculate hours (as float)
             const [sh, sm] = l.startTime.split(':').map(Number);
             const [eh, em] = l.endTime.split(':').map(Number);
             let start = sh + sm / 60;
             let end = eh + em / 60;
             duration = (end - start).toFixed(2);
             durationType = 'hour';
           } else if (l.startDate && l.endDate) {
             const start = new Date(l.startDate);
             const end = new Date(l.endDate);
             // Inclusive: (end - start) in days + 1
             const diff = Math.abs((end - start) / (1000*60*60*24)) + 1;
             duration = diff.toString();
             durationType = 'day';
           }
           return {
             id: l.id,
             leaveType: leaveTypeName,
             leaveDate: l.startDate || '',
             duration,
             durationType,
             reason: l.reason,
             status: l.status,
             submittedDate: l.createdAt
           };
         }));

         res.json({ status: 'success', data: result });
       } catch (err) {
         res.status(500).json({ status: 'error', message: err.message });
       }
     });

     // GET /api/leave-request/:id
     router.get('/:id', async (req, res) => {
       try {
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const userRepo = AppDataSource.getRepository('User');
         const adminRepo = AppDataSource.getRepository('Admin');
         const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
         const { id } = req.params;

         const leave = await leaveRepo.findOneBy({ id });
         if (!leave) return res.status(404).json({ success: false, message: 'Not found' });

         let user = null;
         if (leave.Repid) {
           console.log('Looking up Repid:', leave.Repid);
           user = await userRepo.findOneBy({ id: leave.Repid });
           console.log('User lookup result:', user);
           if (!user) {
             // Try admin
             const admin = await adminRepo.findOneBy({ id: leave.Repid });
             console.log('Admin lookup result:', admin);
             if (admin) {
               user = { User_name: admin.admin_name, department: admin.department, position: admin.position };
             }
           } else {
             // Ensure user object has User_name property
             user = { User_name: user.User_name, department: user.department, position: user.position };
           }
         }
         let leaveTypeObj = null;
         if (leave.leaveType) leaveTypeObj = await leaveTypeRepo.findOneBy({ id: leave.leaveType });

         res.json({
           success: true,
           data: {
             ...leave,
             user: user ? { User_name: user.User_name, department: user.department, position: user.position } : null,
             leaveTypeName: leaveTypeObj ? leaveTypeObj.leave_type : leave.leaveType,
           }
         });
       } catch (err) {
         res.status(500).json({ success: false, message: err.message });
       }
     });

     // GET /api/leave-request/detail/:id - For dialog details
     router.get('/detail/:id', async (req, res) => {
       try {
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const userRepo = AppDataSource.getRepository('User');
         const adminRepo = AppDataSource.getRepository('Admin');
         const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
         const processRepo = AppDataSource.getRepository('ProcessCheck');
         const { id } = req.params;

         const leave = await leaveRepo.findOneBy({ id });
         console.log('Detail API called for leave id:', id);
         if (!leave) return res.status(404).json({ success: false, message: 'Not found' });
         console.log('Leave row:', leave);

         // Get name by looking up Repid in ProcessCheck, then correct table by role
         let name = '-';
         if (leave.Repid) {
           const process = await processRepo.findOneBy({ Repid: leave.Repid });
           console.log('Repid:', leave.Repid, 'Process:', process);
           if (process && process.Role) {
             if (process.Role === 'admin') {
               const admin = await adminRepo.findOneBy({ id: leave.Repid });
               console.log('Admin lookup:', admin);
               if (admin && admin.admin_name) name = admin.admin_name;
             } else {
               const user = await userRepo.findOneBy({ id: leave.Repid });
               console.log('User lookup:', user);
               if (user && user.User_name) name = user.User_name;
             }
           }
         }

         // Get leave type name
         let leaveTypeName = leave.leaveType;
         if (leave.leaveType) {
           const leaveTypeObj = await leaveTypeRepo.findOneBy({ id: leave.leaveType });
           if (leaveTypeObj && leaveTypeObj.leave_type) leaveTypeName = leaveTypeObj.leave_type;
         }

         // Format submittedDate as DD/MM/YYYY
         let submittedDate = '-';
         if (leave.createdAt) {
           const d = new Date(leave.createdAt);
           if (!isNaN(d.getTime())) {
             const day = String(d.getDate()).padStart(2, '0');
             const month = String(d.getMonth() + 1).padStart(2, '0');
             const year = d.getFullYear();
             submittedDate = `${day}/${month}/${year}`;
           }
         }

         // Format endDate as YYYY-MM-DD or '-'
         let endDate = '-';
         if (leave.endDate) {
           const e = new Date(leave.endDate);
           if (!isNaN(e.getTime())) {
             endDate = e.toISOString().slice(0, 10);
           }
         }

         // Format leaveDate (startDate) as YYYY-MM-DD or '-'
         let leaveDate = '-';
         if (leave.startDate) {
           const s = new Date(leave.startDate);
           if (!isNaN(s.getTime())) {
             leaveDate = s.toISOString().slice(0, 10);
           }
         }

         res.json({
           success: true,
           data: {
             name,
             status: leave.status,
             leaveType: leaveTypeName,
             leaveDate,
             endDate,
             reason: leave.reason,
             submittedDate
           }
         });
       } catch (err) {
         res.status(500).json({ success: false, message: err.message });
       }
     });

     // PUT /api/leave-request/:id/status
     router.put('/:id/status', async (req, res) => {
       try {
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const userRepo = AppDataSource.getRepository('User');
         const { status, statusby, rejectedReason } = req.body;
         const { id } = req.params;

         // ดึงชื่อผู้อนุมัติจาก JWT (ถ้าไม่ได้ส่งมา)
         let approverName = statusby;
         const authHeader = req.headers.authorization;
         if (!approverName && authHeader && authHeader.startsWith('Bearer ')) {
           const token = authHeader.split(' ')[1];
           try {
             const decoded = jwt.verify(token, SECRET);
             let user = await userRepo.findOneBy({ id: decoded.userId });
             if (user) {
               approverName = user.User_name;
             } else {
               // fallback หาใน process_check
               const processRepo = AppDataSource.getRepository('ProcessCheck');
               const processCheck = await processRepo.findOneBy({ Repid: decoded.userId });
               if (processCheck) {
                 // หาใน admin table
                 const adminRepo = AppDataSource.getRepository('admin');
                 const admin = await adminRepo.findOneBy({ id: decoded.userId });
                 approverName = admin ? admin.admin_name : processCheck.Email;
               } else {
                 approverName = null;
               }
             }
           } catch (err) {
             return res.status(401).json({ success: false, message: 'Invalid or expired token' });
           }
         }

         const leave = await leaveRepo.findOneBy({ id: id });
         if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

         leave.status = status;
         leave.statusBy = approverName;
         leave.statusChangeTime = new Date();
         if (status === 'approved') {
           leave.approvedTime = new Date();
         }
         if (status === 'rejected') {
           leave.rejectedTime = new Date();
           if (rejectedReason) leave.rejectedReason = rejectedReason;
         }
         await leaveRepo.save(leave);

         res.json({ success: true, data: leave });
       } catch (err) {
         res.status(500).json({ success: false, message: err.message });
       }
     });
     return router;
   };
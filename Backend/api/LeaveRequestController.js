   // Backend/api/LeaveRequestController.js
   const express = require('express');
   const multer = require('multer');
   const path = require('path');
   const fs = require('fs');
   const jwt = require('jsonwebtoken');
   const config = require('../config');
   const LineController = require('./LineController');

   // ตั้งค่าที่เก็บไฟล์
   const storage = multer.diskStorage({
     destination: function (req, file, cb) {
       const uploadPath = config.getLeaveUploadsPath();
       if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
       cb(null, uploadPath);
     },
     filename: function (req, file, cb) {
       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
       cb(null, uniqueSuffix + path.extname(file.originalname));
     }
   });
   const upload = multer({ storage: storage });

   // ใช้ฟังก์ชัน parseAttachments ปลอดภัย
   function parseAttachments(val) {
     if (!val) return [];
     try {
       return JSON.parse(val);
     } catch (e) {
       console.error('Invalid attachments JSON:', val, e);
       return [];
     }
   }

   // ใช้ฟังก์ชันแปลงวันที่ให้เป็น Local Time (แก้บัค -1 วัน)
   function parseLocalDate(dateStr) {
     if (!dateStr) return null;
     // dateStr: 'YYYY-MM-DD'
     const [year, month, day] = dateStr.split('-').map(Number);
     return new Date(year, month - 1, day);
   }

     // Function to send LINE notification when leave request status changes
  async function sendLineNotification(leave, status, approverName, rejectedReason) {
    try {
      // Get the user's LINE user ID from ProcessCheck table
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const processCheck = await processRepo.findOneBy({ Repid: leave.Repid });
      
      console.log('=== LINE Notification Database Debug ===');
      console.log('Leave Repid:', leave.Repid);
      console.log('ProcessCheck found:', !!processCheck);
      if (processCheck) {
        console.log('ProcessCheck lineUserId:', processCheck.lineUserId);
        console.log('ProcessCheck lineUserId type:', typeof processCheck.lineUserId);
        console.log('ProcessCheck lineUserId length:', processCheck.lineUserId ? processCheck.lineUserId.length : 0);
      }
      console.log('========================================');
      
      if (!processCheck || !processCheck.lineUserId) {
        console.log('User not linked to LINE or not found:', leave.Repid);
        return; // User not linked to LINE
      }

      // Get the leave type name from the database
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      const leaveTypeData = await leaveTypeRepo.findOneBy({ id: leave.leaveType });
      const leaveTypeNameTh = leaveTypeData ? leaveTypeData.leave_type_th : 'ไม่ระบุประเภท';
      const leaveTypeNameEn = leaveTypeData ? leaveTypeData.leave_type_en : 'Unknown Type';
      const leaveTypeNameBilingual = leaveTypeNameEn && leaveTypeNameEn !== leaveTypeNameTh 
        ? `${leaveTypeNameTh} (${leaveTypeNameEn})` 
        : leaveTypeNameTh;

      // Format the notification message (Thai and English)
      let message = '';
      const startDate = new Date(leave.startDate).toLocaleDateString('th-TH');
      const endDate = new Date(leave.endDate).toLocaleDateString('th-TH');
      const currentTime = new Date().toLocaleString('th-TH');
       
       if (status === 'approved') {
         message = `✅ คำขอการลาของคุณได้รับการอนุมัติแล้ว!\n\n` +
                   `📋 ประเภทการลา: ${leaveTypeNameBilingual}\n` +
                   `📅 วันที่: ${startDate} - ${endDate}\n` +
                   `👤 ผู้อนุมัติ: ${approverName}\n` +
                   `⏰ เวลาที่อนุมัติ: ${currentTime}\n\n` +
                   `ขอบคุณที่ใช้ระบบจัดการการลาของเรา!\n\n` +
                   `---\n` +
                   `✅ Your leave request has been approved!\n\n` +
                   `📋 Leave Type: ${leaveTypeNameBilingual}\n` +
                   `📅 Date: ${startDate} - ${endDate}\n` +
                   `👤 Approved by: ${approverName}\n` +
                   `⏰ Approved at: ${currentTime}\n\n` +
                   `Thank you for using our leave management system!`;
       } else if (status === 'rejected') {
         message = `❌ คำขอการลาของคุณไม่ได้รับการอนุมัติ\n\n` +
                   `📋 ประเภทการลา: ${leaveTypeNameBilingual}\n` +
                   `📅 วันที่: ${startDate} - ${endDate}\n` +
                   `👤 ผู้อนุมัติ: ${approverName}\n` +
                   `⏰ เวลาที่ปฏิเสธ: ${currentTime}`;
         
         if (rejectedReason) {
           message += `\n📝 เหตุผล: ${rejectedReason}`;
         }
         
         message += `\n\nหากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบ\n\n` +
                   `---\n` +
                   `❌ Your leave request has been rejected\n\n` +
                   `📋 Leave Type: ${leaveTypeNameBilingual}\n` +
                   `📅 Date: ${startDate} - ${endDate}\n` +
                   `👤 Rejected by: ${approverName}\n` +
                   `⏰ Rejected at: ${currentTime}`;
         
         if (rejectedReason) {
           message += `\n📝 Reason: ${rejectedReason}`;
         }
         
         message += `\n\nIf you have any questions, please contact the administrator.`;
       }

       // Send the notification via LINE
       const notificationResult = await LineController.sendNotification(processCheck.lineUserId, message);
       
       if (notificationResult.success) {
         console.log('LINE notification sent successfully to:', processCheck.lineUserId);
       } else {
         console.error('Failed to send LINE notification:', notificationResult.error);
         console.log('LINE user ID:', processCheck.lineUserId);
         console.log('Message length:', message.length);
       }
       
     } catch (error) {
       console.error('Error sending LINE notification:', error);
       throw error;
     }
   }

   module.exports = (AppDataSource) => {
     const router = express.Router();

     // POST /api/leave-request
     router.post('/', upload.array('attachments', 10), async (req, res) => {
       try {
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         let userId = null;
         let role = null;
         // ดึง userId จาก JWT
         const authHeader = req.headers.authorization;
         if (authHeader && authHeader.startsWith('Bearer ')) {
           const token = authHeader.split(' ')[1];
           try {
             const decoded = jwt.verify(token, config.server.jwtSecret);
             userId = decoded.userId;
             role = decoded.role;
           } catch (err) {
             return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
           }
         }
         // กำหนดภาษา (ต้องมาก่อน validation quota)
         const lang = (req.headers['accept-language'] || '').toLowerCase().startsWith('en') ? 'en' : 'th';
         // ดึงตำแหน่งจาก user หรือ admin
         let employeeType = null;
         if (userId) {
           if (role === 'admin') {
             const adminRepo = AppDataSource.getRepository('Admin');
             const admin = await adminRepo.findOneBy({ id: userId });
             employeeType = admin ? admin.position : null;
           } else if (role === 'superadmin') {
             const superadminRepo = AppDataSource.getRepository('SuperAdmin');
             const superadmin = await superadminRepo.findOneBy({ id: userId });
             employeeType = superadmin ? superadmin.position : null;
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

         // --- Validation: quota ---
         // 1. ดึง quota ของ user
         const leaveQuotaRepo = AppDataSource.getRepository('LeaveQuota');
         const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
         // ดึง leaveType entity
         let leaveTypeEntity = null;
         if (leaveType && leaveType.length > 20) {
           leaveTypeEntity = await leaveTypeRepo.findOneBy({ id: leaveType });
         } else {
           leaveTypeEntity = await leaveTypeRepo.findOne({
             where: [
               { leave_type_th: leaveType },
               { leave_type_en: leaveType }
             ]
           });
         }
         // ถ้าเป็น Emergency Leave ไม่ต้องตรวจสอบ quota
         if (
           leaveTypeEntity &&
           (leaveTypeEntity.leave_type_en === 'Emergency' || leaveTypeEntity.leave_type_th === 'ลาฉุกเฉิน')
         ) {
           // ข้าม validation quota สำหรับ Emergency Leave
         } else {
           // ดึง quota ของ leaveType นี้
           const quotaRow = leaveTypeEntity ? await leaveQuotaRepo.findOne({ where: { positionId: employeeType, leaveTypeId: leaveTypeEntity.id } }) : null;
           if (!quotaRow) {
             return res.status(400).json({ status: 'error', message: 'ไม่พบโควต้าการลาสำหรับประเภทนี้' });
           }
           const quota = quotaRow.quota;
           // 2. คำนวณ leave ที่ใช้ไปในปีนี้ (approved เฉพาะ leaveType นี้)
           const year = (parseLocalDate(startDate)).getFullYear();
           const startOfYear = new Date(year, 0, 1);
           const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
           const { Between } = require('typeorm');
           const approvedLeaves = await leaveRepo.find({
             where: {
               Repid: userId,
               status: 'approved',
               startDate: Between(startOfYear, endOfYear)
             }
           });
           // 3. คำนวณ leave ที่ใช้ไป (approved) ในปีนี้ (ชั่วโมง เฉพาะ leaveType นี้)
           let usedHours = 0;
           function parseTimeToMinutes(t) {
             if (!t) return 0;
             const [h, m] = t.split(':').map(Number);
             return h * 60 + (m || 0);
           }
           for (const lr of approvedLeaves) {
             let leaveTypeName = lr.leaveType;
             if (leaveTypeName && leaveTypeName.length > 20) {
               const leaveTypeEntity2 = await leaveTypeRepo.findOneBy({ id: leaveTypeName });
               if (leaveTypeEntity2 && leaveTypeEntity2.leave_type_th) {
                 leaveTypeName = leaveTypeEntity2.leave_type_th;
               }
             }
             // เฉพาะ leaveType นี้เท่านั้น
             if (
               leaveTypeName === leaveTypeEntity.leave_type_th ||
               leaveTypeName === leaveTypeEntity.leave_type_en
             ) {
               // Personal leave: อาจเป็นชั่วโมงหรือวัน
               if (leaveTypeEntity.leave_type_en === 'Personal' || leaveTypeEntity.leave_type_th === 'ลากิจ') {
                 if (lr.startTime && lr.endTime) {
                   const startMinutes = parseTimeToMinutes(lr.startTime);
                   const endMinutes = parseTimeToMinutes(lr.endTime);
                   let durationHours = (endMinutes - startMinutes) / 60;
                   if (durationHours < 0 || isNaN(durationHours)) durationHours = 0;
                   usedHours += durationHours;
                 } else if (lr.startDate && lr.endDate) {
                   const start = new Date(lr.startDate);
                   const end = new Date(lr.endDate);
                   let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                   if (days < 0 || isNaN(days)) days = 0;
                   usedHours += days * config.business.workingHoursPerDay;
                 }
               } else {
                 // อื่น ๆ: วันเท่านั้น
                 if (lr.startDate && lr.endDate) {
                   const start = new Date(lr.startDate);
                   const end = new Date(lr.endDate);
                   let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                   if (days < 0 || isNaN(days)) days = 0;
                   usedHours += days * config.business.workingHoursPerDay;
                 }
               }
             }
           }
           // 4. คำนวณ leave ที่ขอใหม่ (ชั่วโมง)
           let requestHours = 0;
           if (leaveTypeEntity.leave_type_en === 'Personal' || leaveTypeEntity.leave_type_th === 'ลากิจ') {
             if (startTime && endTime) {
               const startMinutes = parseTimeToMinutes(startTime);
               const endMinutes = parseTimeToMinutes(endTime);
               let durationHours = (endMinutes - startMinutes) / 60;
               if (durationHours < 0 || isNaN(durationHours)) durationHours = 0;
               requestHours += durationHours;
             } else if (startDate && endDate) {
               const start = parseLocalDate(startDate);
               const end = parseLocalDate(endDate);
               let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
               if (days < 0 || isNaN(days)) days = 0;
               requestHours += days * config.business.workingHoursPerDay;
             }
           } else {
             if (startDate && endDate) {
               const start = parseLocalDate(startDate);
               const end = parseLocalDate(endDate);
               let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
               if (days < 0 || isNaN(days)) days = 0;
               requestHours += days * config.business.workingHoursPerDay;
             }
           }
           // 5. quota (ชั่วโมง)
           const totalQuotaHours = quota * config.business.workingHoursPerDay;
           // 6. ถ้า used + request > quota => reject
           if (usedHours + requestHours > totalQuotaHours) {
             return res.status(400).json({
               status: 'error',
               message: lang === 'en'
                 ? 'You have exceeded your leave quota for this type.'
                 : 'คุณใช้วันลาประเภทนี้ครบโควต้าแล้ว ไม่สามารถขอใบลาเพิ่มได้'
             });
           }
         }

         // ตรวจสอบภาษา
         // const lang = (req.headers['accept-language'] || '').toLowerCase().startsWith('en') ? 'en' : 'th';

         // --- Contact Validation ---
         if (!contact) {
           return res.status(400).json({
             status: 'error',
             message: lang === 'en' ? 'Contact information is required.' : 'กรุณากรอกช่องทางติดต่อ'
           });
         }

         // ฟังก์ชันตรวจสอบเวลาในช่วง 09:00-18:00
         function isTimeInRange(timeStr) {
           if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) return false;
           const [h, m] = timeStr.split(':').map(Number);
           const minutes = h * 60 + m;
           return minutes >= config.business.workingStartHour * 60 && minutes <= config.business.workingEndHour * 60;
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
                 ? `You can request leave only during working hours: ${config.business.workingStartHour}:00 to ${config.business.workingEndHour}:00.`
                 : `สามารถลาได้เฉพาะช่วงเวลาทำงาน ${config.business.workingStartHour}:00 ถึง ${config.business.workingEndHour}:00 เท่านั้น`
             });
           }
         }

         const attachmentsArr = req.files ? req.files.map(f => f.filename) : [];
         // Determine if the leave request is backdated
         let backdated = 0; // Default to 0 (not backdated)
         if (startDate) {
           const today = new Date();
           today.setHours(0, 0, 0, 0);
           const leaveStart = parseLocalDate(startDate);
           if (leaveStart && leaveStart < today) {
             // ถ้าวันลาอยู่ในอดีต (ย้อนหลัง) ให้ backdated = 1
             backdated = 1;
           }
           // ถ้าวันลาเป็นวันปัจจุบันหรืออนาคต ให้ backdated = 0 (ไม่นับเป็นย้อนหลัง)
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
           imgLeave: attachmentsArr.length === 1 ? attachmentsArr[0] : null, // backward compatible
           attachments: attachmentsArr.length > 0 ? JSON.stringify(attachmentsArr) : null,
           status: 'pending',
           backdated, // set backdated column
         };

         // เพิ่มข้อมูลลงฐานข้อมูล
         const leave = leaveRepo.create(leaveData);
         const savedLeave = await leaveRepo.save(leave);

         // Emit Socket.io event for real-time notification
         if (global.io) {
           // Get user information for the notification
           let userName = 'Unknown User';
           let leaveTypeName = leaveType;
           
           try {
             // Get user name based on role
             if (role === 'admin') {
               const adminRepo = AppDataSource.getRepository('Admin');
               const admin = await adminRepo.findOneBy({ id: userId });
               userName = admin ? admin.name : 'Unknown User';
             } else if (role === 'superadmin') {
               const superadminRepo = AppDataSource.getRepository('SuperAdmin');
               const superadmin = await superadminRepo.findOneBy({ id: userId });
               userName = superadmin ? superadmin.name : 'Unknown User';
             } else {
               const userRepo = AppDataSource.getRepository('User');
               const user = await userRepo.findOneBy({ id: userId });
               userName = user ? user.name : 'Unknown User';
             }
             
             // Get leave type name
             if (leaveTypeEntity) {
               leaveTypeName = leaveTypeEntity.leave_type_th || leaveTypeEntity.leave_type_en || leaveType;
             }
           } catch (error) {
             console.error('Error getting user/leave type info for socket emit:', error);
           }
           
           // Emit to admin room for new leave request notification
           global.io.to('admin_room').emit('newLeaveRequest', {
             requestId: savedLeave.id,
             userName: userName,
             leaveType: leaveTypeName,
             startDate: savedLeave.startDate,
             endDate: savedLeave.endDate,
             reason: savedLeave.reason,
             employeeId: savedLeave.Repid
           });
         }

         res.status(201).json({ status: 'success', data: savedLeave, message: 'Leave request created' });
       } catch (err) {
         res.status(500).json({ status: 'error', message: err.message });
       }
     });

     // GET /api/leave-request/pending
     router.get('/pending', async (req, res) => {
       try {
         // --- i18n: ตรวจจับภาษา ---
         let lang = req.headers['accept-language'] || req.query.lang || 'th';
         lang = lang.split(',')[0].toLowerCase().startsWith('en') ? 'en' : 'th';
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const userRepo = AppDataSource.getRepository('User');
         const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
         // --- เพิ่ม paging ---
         const page = parseInt(req.query.page) || 1;
         const limit = parseInt(req.query.limit) || config.pagination.defaultLimit;
         const skip = (page - 1) * limit;
         // --- เพิ่ม filter leaveType, startDate, endDate, month, year ---
         const leaveType = req.query.leaveType || null;
         const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
         const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
         const month = req.query.month ? parseInt(req.query.month) : null;
         const year = req.query.year ? parseInt(req.query.year) : null;
         let where = { status: 'pending' };
         if (leaveType) {
           const leaveTypeObj = await leaveTypeRepo.findOneBy({ id: leaveType });
           if (leaveTypeObj) {
             where = { ...where, leaveType: leaveTypeObj.id };
           } else {
             where = { ...where, leaveType };
           }
         }
         if (month && year) {
           const { Between } = require('typeorm');
           const startOfMonth = new Date(year, month - 1, 1);
           const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
           where = { ...where, createdAt: Between(startOfMonth, endOfMonth) };
         } else if (year) {
           const { Between } = require('typeorm');
           const startOfYear = new Date(year, 0, 1);
           const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
           where = { ...where, createdAt: Between(startOfYear, endOfYear) };
         }
         // --- ใน /pending ---
         const date = req.query.date ? new Date(req.query.date) : null;
         if (date) {
           const { Between } = require('typeorm');
           const startOfDay = new Date(date);
           startOfDay.setHours(0, 0, 0, 0);
           const endOfDay = new Date(date);
           endOfDay.setHours(23, 59, 59, 999);
           where = { ...where, createdAt: Between(startOfDay, endOfDay) };
         }
         // --- เพิ่ม filter backdated ---
         const backdatedParam = req.query.backdated;
         if (backdatedParam === '1') {
           where = { ...where, backdated: 1 };
         } else if (backdatedParam === '0') {
           where = { ...where, backdated: 0 }; // ต้องเป็น 0 เท่านั้น
         }
         // ดึง leave requests ที่ pending (paging)
         const [pendingLeaves, total] = await Promise.all([
           leaveRepo.find({
             where,
             order: { createdAt: 'DESC' },
             skip,
             take: limit
           }),
           leaveRepo.count({ where })
         ]);
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
               } else {
                 // ถ้าไม่เจอใน admin ให้ลองหาใน superadmin
                 const superadminRepo = AppDataSource.getRepository('SuperAdmin');
                 const superadmin = await superadminRepo.findOneBy({ id: leave.Repid });
                 if (superadmin) {
                   user = { User_name: superadmin.superadmin_name, department: superadmin.department, position: superadmin.position };
                 }
               }
             } else {
               user = { User_name: user.User_name, department: user.department, position: user.position };
             }
           }
           let leaveTypeName_th = null;
           let leaveTypeName_en = null;
           if (leave.leaveType) {
             leaveTypeObj = await leaveTypeRepo.findOneBy({ id: leave.leaveType });
             leaveTypeName_th = leaveTypeObj ? leaveTypeObj.leave_type_th : leave.leaveType;
             leaveTypeName_en = leaveTypeObj ? leaveTypeObj.leave_type_en : leave.leaveType;
           }
           return {
             ...leave,
             user: user ? { User_name: user.User_name, department: user.department, position: user.position } : null,
             leaveTypeName_th,
             leaveTypeName_en,
             attachments: parseAttachments(leave.attachments),
             backdated: Number(leave.backdated),
           };
         }));
         res.json({ status: 'success', data: result, total, page, totalPages: Math.ceil(total / limit), message: lang === 'th' ? 'ดึงข้อมูลสำเร็จ' : 'Fetch success' });
       } catch (err) {
         let lang = req.headers['accept-language'] || req.query.lang || 'th';
         lang = lang.split(',')[0].toLowerCase().startsWith('en') ? 'en' : 'th';
         res.status(500).json({ status: 'error', message: lang === 'th' ? 'เกิดข้อผิดพลาด: ' + err.message : 'Error: ' + err.message });
       }
     });

     // GET /api/leave-request/history
     router.get('/history', async (req, res) => {
       try {
         // --- i18n: ตรวจจับภาษา ---
         let lang = req.headers['accept-language'] || req.query.lang || 'th';
         lang = lang.split(',')[0].toLowerCase().startsWith('en') ? 'en' : 'th';
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const userRepo = AppDataSource.getRepository('User');
         const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
         const adminRepo = AppDataSource.getRepository('Admin');
         const { userId, status } = req.query;
         // --- เพิ่ม filter เดือน/ปี ---
         const month = req.query.month ? parseInt(req.query.month) : null;
         const year = req.query.year ? parseInt(req.query.year) : null;
         // --- เพิ่ม filter ช่วงวัน ---
         const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
         const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
         let where;
         const { Between, In } = require('typeorm');
         if (status) {
           // รองรับ status หลายค่า (comma separated)
           let statusArr = status;
           if (typeof status === 'string' && status.includes(',')) {
             statusArr = status.split(',').map(s => s.trim());
           }
           if (Array.isArray(statusArr)) {
             where = statusArr.map(s => ({ status: s }));
             if (userId) where = statusArr.map(s => ({ status: s, Repid: userId }));
             if (month && year) {
               const startOfMonth = new Date(year, month - 1, 1);
               const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
               where = statusArr.map(s => ({ status: s, createdAt: Between(startOfMonth, endOfMonth) }));
               if (userId) where = statusArr.map(s => ({ status: s, Repid: userId, createdAt: Between(startOfMonth, endOfMonth) }));
             } else if (year) {
               const startOfYear = new Date(year, 0, 1);
               const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
               where = statusArr.map(s => ({ status: s, createdAt: Between(startOfYear, endOfYear) }));
               if (userId) where = statusArr.map(s => ({ status: s, Repid: userId, createdAt: Between(startOfYear, endOfYear) }));
             }
             // --- เพิ่ม filter ช่วงวัน ---
             if (startDate && endDate) {
               where = where.map(w => ({ ...w, startDate: Between(startDate, endDate) }));
             } else if (startDate) {
               where = where.map(w => ({ ...w, startDate: Between(startDate, new Date(config.business.maxDate)) }));
             } else if (endDate) {
               where = where.map(w => ({ ...w, startDate: Between(new Date(config.business.minDate), endDate) }));
             }
           } else {
             // เดิม: status เดียว
             where = [{ status }];
             if (userId) where = [{ status, Repid: userId }];
             if (month && year) {
               const startOfMonth = new Date(year, month - 1, 1);
               const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
               where = [{ status, createdAt: Between(startOfMonth, endOfMonth) }];
               if (userId) where = [{ status, Repid: userId, createdAt: Between(startOfMonth, endOfMonth) }];
             } else if (year) {
               const startOfYear = new Date(year, 0, 1);
               const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
               where = [{ status, createdAt: Between(startOfYear, endOfYear) }];
               if (userId) where = [{ status, Repid: userId, createdAt: Between(startOfYear, endOfYear) }];
             }
             // --- เพิ่ม filter ช่วงวัน ---
             if (startDate && endDate) {
               where = where.map(w => ({ ...w, startDate: Between(startDate, endDate) }));
             } else if (startDate) {
               where = where.map(w => ({ ...w, startDate: Between(startDate, new Date(config.business.maxDate)) }));
             } else if (endDate) {
               where = where.map(w => ({ ...w, startDate: Between(new Date(config.business.minDate), endDate) }));
             }
           }
         } else {
           // ไม่ได้กรอง status (default: approved, rejected, pending)
           where = [
             { status: 'approved' },
             { status: 'rejected' },
             { status: 'pending' }
           ];
           if (userId) {
             where = [
               { status: 'approved', Repid: userId },
               { status: 'rejected', Repid: userId },
               { status: 'pending', Repid: userId }
             ];
           }
           if (month && year) {
             const startOfMonth = new Date(year, month - 1, 1);
             const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
             where = [
               { status: 'approved', createdAt: Between(startOfMonth, endOfMonth) },
               { status: 'rejected', createdAt: Between(startOfMonth, endOfMonth) },
               { status: 'pending', createdAt: Between(startOfMonth, endOfMonth) }
             ];
             if (userId) where = [
               { status: 'approved', Repid: userId, createdAt: Between(startOfMonth, endOfMonth) },
               { status: 'rejected', Repid: userId, createdAt: Between(startOfMonth, endOfMonth) },
               { status: 'pending', Repid: userId, createdAt: Between(startOfMonth, endOfMonth) }
             ];
           } else if (year) {
             const startOfYear = new Date(year, 0, 1);
             const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
             where = [
               { status: 'approved', createdAt: Between(startOfYear, endOfYear) },
               { status: 'rejected', createdAt: Between(startOfYear, endOfYear) },
               { status: 'pending', createdAt: Between(startOfYear, endOfYear) }
             ];
             if (userId) where = [
               { status: 'approved', Repid: userId, createdAt: Between(startOfYear, endOfYear) },
               { status: 'rejected', Repid: userId, createdAt: Between(startOfYear, endOfYear) },
               { status: 'pending', Repid: userId, createdAt: Between(startOfYear, endOfYear) }
             ];
           }
           // --- เพิ่ม filter ช่วงวัน ---
           if (startDate && endDate) {
             where = where.map(w => ({ ...w, startDate: Between(startDate, endDate) }));
           } else if (startDate) {
             where = where.map(w => ({ ...w, startDate: Between(startDate, new Date(config.business.maxDate)) }));
           } else if (endDate) {
             where = where.map(w => ({ ...w, startDate: Between(new Date(config.business.minDate), endDate) }));
           }
         }
         // --- ใน /history ---
         const singleDate = req.query.date ? new Date(req.query.date) : null;
         if (singleDate) {
           where = where.map(w => {
             const startOfDay = new Date(singleDate);
             startOfDay.setHours(0, 0, 0, 0);
             const endOfDay = new Date(singleDate);
             endOfDay.setHours(23, 59, 59, 999);
             return { ...w, createdAt: Between(startOfDay, endOfDay) }; 
           });
         }
         // --- เพิ่ม filter backdated (ใช้ field จริงจาก database) ---
         const backdatedParamH = req.query.backdated;
         if (backdatedParamH === '1') {
           where = Array.isArray(where)
             ? where.map(w => ({ ...w, backdated: 1 }))
             : { ...where, backdated: 1 };
         } else if (backdatedParamH === '0') {
           where = Array.isArray(where)
             ? where.map(w => ({ ...w, backdated: 0 }))
             : { ...where, backdated: 0 };
         }
         // --- เพิ่ม filter leaveType ---
         const leaveType = req.query.leaveType;
         if (leaveType) {
           where = Array.isArray(where)
             ? where.map(w => ({ ...w, leaveType }))
             : { ...where, leaveType };
         }
         // --- เพิ่ม paging ---
         const page = parseInt(req.query.page) || 1;
         const limit = parseInt(req.query.limit) || config.pagination.defaultLimit;
         const skip = (page - 1) * limit;
         // ดึงใบคำขอที่ status เป็น approved หรือ rejected (และ filter ตาม userId/เดือน/ปี/ช่วงวัน ถ้ามี) (paging)
         const [processedLeaves, total] = await Promise.all([
           leaveRepo.find({
             where,
             order: { createdAt: 'DESC' },
             skip,
             take: limit
           }),
           leaveRepo.count({ where })
         ]);
         // --- เพิ่มการคำนวณ approvedCount/rejectedCount ตาม filter ---
         const approvedCount = await leaveRepo.count({ where: where.map(w => ({ ...w, status: 'approved' })) });
         const rejectedCount = await leaveRepo.count({ where: where.map(w => ({ ...w, status: 'rejected' })) });
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
               } else {
                 // ถ้าไม่เจอใน admin ให้ลองหาใน superadmin
                 const superadminRepo = AppDataSource.getRepository('SuperAdmin');
                 const superadmin = await superadminRepo.findOneBy({ id: leave.Repid });
                 if (superadmin) {
                   user = { User_name: superadmin.superadmin_name, department: superadmin.department, position: superadmin.position };
                 }
               }
             } else {
               user = { User_name: user.User_name, department: user.department, position: user.position };
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
           // เพิ่มดึงชื่อ admin ที่อนุมัติ/ไม่อนุมัติ
           let approvedBy = null;
           let rejectedBy = null;
           if (leave.statusBy && leave.status === 'approved') {
             const admin = await adminRepo.findOneBy({ id: leave.statusBy });
             approvedBy = admin ? admin.admin_name : leave.statusBy;
           }
           if (leave.statusBy && leave.status === 'rejected') {
             const admin = await adminRepo.findOneBy({ id: leave.statusBy });
             rejectedBy = admin ? admin.admin_name : leave.statusBy;
           }
           return {
             id: leave.id,
             leaveType: leaveTypeObj ? leaveTypeObj.leave_type_th : leave.leaveType,
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
             approvedBy,
             rejectedBy,
             rejectionReason: leave.rejectedReason || null,
             attachments: parseAttachments(leave.attachments),
             contact: leave.contact || null,
             // ส่ง backdated ตรงจาก db
             backdated: Number(leave.backdated),
           };
         }));
         res.json({ status: 'success', data: result, total, page, totalPages: Math.ceil(total / limit), approvedCount, rejectedCount, message: lang === 'th' ? 'ดึงข้อมูลสำเร็จ' : 'Fetch success' });
       } catch (err) {
         let lang = req.headers['accept-language'] || req.query.lang || 'th';
         lang = lang.split(',')[0].toLowerCase().startsWith('en') ? 'en' : 'th';
         res.status(500).json({ status: 'error', message: lang === 'th' ? 'เกิดข้อผิดพลาด: ' + err.message : 'Error: ' + err.message });
       }
     });

     // GET /api/leave-request/dashboard-stats
     router.get('/dashboard-stats', async (req, res) => {
       try {
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const { month, year } = req.query;
         let wherePending = { status: 'pending' };
         let whereApproved = { status: 'approved' };
         let whereRejected = { status: 'rejected' };
         let whereAll = {};
         if (month && year) {
           const { Between } = require('typeorm');
           const m = parseInt(month);
           const y = parseInt(year);
           const startOfMonth = new Date(y, m - 1, 1);
           const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
           wherePending = { status: 'pending', createdAt: Between(startOfMonth, endOfMonth) };
           whereApproved = { status: 'approved', createdAt: Between(startOfMonth, endOfMonth) };
           whereRejected = { status: 'rejected', createdAt: Between(startOfMonth, endOfMonth) };
           whereAll = { createdAt: Between(startOfMonth, endOfMonth) };
         } else if (year) {
           const { Between } = require('typeorm');
           const y = parseInt(year);
           const startOfYear = new Date(y, 0, 1);
           const endOfYear = new Date(y, 11, 31, 23, 59, 59, 999);
           wherePending = { status: 'pending', createdAt: Between(startOfYear, endOfYear) };
           whereApproved = { status: 'approved', createdAt: Between(startOfYear, endOfYear) };
           whereRejected = { status: 'rejected', createdAt: Between(startOfYear, endOfYear) };
           whereAll = { createdAt: Between(startOfYear, endOfYear) };
         }
         // 1. Pending count
         const pendingCount = await leaveRepo.count({ where: wherePending });
         // 2. Approved count
         const approvedCount = await leaveRepo.count({ where: whereApproved });
         // 3. Rejected count
         const rejectedCount = await leaveRepo.count({ where: whereRejected });
         // 4. User count (unique Repid in leave requests)
         const allLeaves = await leaveRepo.find({ where: whereAll });
         const userIds = Array.from(new Set(allLeaves.map(l => l.Repid)));
         const userCount = userIds.length;
         // 5. Average leave days (approved)
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
             rejectedCount,
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
         const decoded = jwt.verify(token, config.server.jwtSecret);
         const userId = decoded.userId;

         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
         const leaves = await leaveRepo.find({ where: { Repid: userId }, order: { createdAt: 'DESC' } });

         // Map to required fields, with leave type name
         const result = await Promise.all(leaves.map(async l => {
           let leaveTypeName = l.leaveType;
           if (l.leaveType) {
             const leaveTypeObj = await leaveTypeRepo.findOneBy({ id: l.leaveType });
             if (leaveTypeObj) leaveTypeName = leaveTypeObj.leave_type_th;
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

     // GET /api/leave-request/user/:id - Get all leave requests for a specific user by id
     router.get('/user/:id', async (req, res) => {
       try {
         const { id } = req.params;
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const userRepo = AppDataSource.getRepository('User');
         const adminRepo = AppDataSource.getRepository('Admin');
         const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
         // --- เพิ่ม paging ---
         const page = parseInt(req.query.page) || 1;
         const limit = parseInt(req.query.limit) || config.pagination.defaultLimit;
         const skip = (page - 1) * limit;
         // ดึง leave requests ของ user ตาม id (paging)
         const [leaves, total] = await Promise.all([
           leaveRepo.find({ where: { Repid: id }, order: { createdAt: 'DESC' }, skip, take: limit }),
           leaveRepo.count({ where: { Repid: id } })
         ]);
         const result = await Promise.all(leaves.map(async (leave) => {
           let user = null;
           let leaveTypeObj = null;
           let leaveTypeName_th = null;
           let leaveTypeName_en = null;
           if (leave.Repid) {
             user = await userRepo.findOneBy({ id: leave.Repid });
             if (!user) {
               // ถ้าไม่เจอใน user ให้ลองหาใน admin
               const admin = await adminRepo.findOneBy({ id: leave.Repid });
               if (admin) {
                 user = { User_name: admin.admin_name, department: admin.department, position: admin.position };
               } else {
                 // ถ้าไม่เจอใน admin ให้ลองหาใน superadmin
                 const superadminRepo = AppDataSource.getRepository('SuperAdmin');
                 const superadmin = await superadminRepo.findOneBy({ id: leave.Repid });
                 if (superadmin) {
                   user = { User_name: superadmin.superadmin_name, department: superadmin.department, position: superadmin.position };
                 }
               }
             } else {
               user = { User_name: user.User_name, department: user.department, position: user.position };
             }
           }
           if (leave.leaveType) {
             leaveTypeObj = await leaveTypeRepo.findOneBy({ id: leave.leaveType });
             leaveTypeName_th = leaveTypeObj ? leaveTypeObj.leave_type_th : leave.leaveType;
             leaveTypeName_en = leaveTypeObj ? leaveTypeObj.leave_type_en : leave.leaveType;
           }
           // คำนวณจำนวนวันหรือชั่วโมงลา
           let duration = '';
           let durationType = '';
           if (leave.startTime && leave.endTime) {
             // Calculate hours
             const [sh, sm] = leave.startTime.split(":").map(Number);
             const [eh, em] = leave.endTime.split(":").map(Number);
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
             leaveType: leave.leaveType, // id
             leaveTypeName_th,
             leaveTypeName_en,
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
             approvedBy,
             rejectedBy,
             rejectionReason: leave.rejectedReason || null,
             attachments: parseAttachments(leave.attachments),
             // เพิ่ม backdated
             backdated: Number(leave.backdated),
           };
         }));
         res.json({ status: 'success', data: result, total, page, totalPages: Math.ceil(total / limit) });
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
           user = await userRepo.findOneBy({ id: leave.Repid });
           if (!user) {
             // Try admin
             const admin = await adminRepo.findOneBy({ id: leave.Repid });
             if (admin) {
               user = { User_name: admin.admin_name, department: admin.department, position: admin.position };
             } else {
               // Try superadmin
               const superadminRepo = AppDataSource.getRepository('SuperAdmin');
               const superadmin = await superadminRepo.findOneBy({ id: leave.Repid });
               if (superadmin) {
                 user = { User_name: superadmin.superadmin_name, department: superadmin.department, position: superadmin.position };
               }
             }
           } else {
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
             leaveTypeName: leaveTypeObj ? leaveTypeObj.leave_type_th : leave.leaveType,
             attachments: parseAttachments(leave.attachments),
           }
         });
       } catch (err) {
         res.status(500).json({ success: false, message: err.message });
       }
     });

     // PUT /api/leave-request/:id (update leave request)
     router.put('/:id', upload.array('attachments', 10), async (req, res) => {
       try {
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const { id } = req.params;
         const leave = await leaveRepo.findOneBy({ id });
         if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
         // --- เพิ่ม validation: ห้ามแก้ไขถ้า startDate <= วันนี้ ---
         const now = new Date();
         now.setHours(0, 0, 0, 0);
         const leaveStart = leave.startDate ? new Date(leave.startDate) : null;
         if (leaveStart) leaveStart.setHours(0, 0, 0, 0);
         if (leaveStart && leaveStart <= now) {
           return res.status(400).json({ success: false, message: 'Cannot edit leave request that has already started.' });
         }
         // อัปเดตฟิลด์ที่ส่งมา
         const {
           leaveType, personalLeaveType, startDate, endDate,
           startTime, endTime, reason, supervisor, contact
         } = req.body;
         if (leaveType !== undefined) leave.leaveType = leaveType;
         if (personalLeaveType !== undefined) leave.personalLeaveType = personalLeaveType;
         if (startDate !== undefined) leave.startDate = startDate;
         if (endDate !== undefined) leave.endDate = endDate;
         if (startTime !== undefined) leave.startTime = startTime;
         if (endTime !== undefined) leave.endTime = endTime;
         if (reason !== undefined) leave.reason = reason;
         if (supervisor !== undefined) leave.supervisor = supervisor;
         if (contact !== undefined) leave.contact = contact;
         
         // คำนวณค่า backdated ใหม่เมื่อมีการอัปเดตวันที่หรือเวลา
         if (startDate !== undefined || startTime !== undefined) {
           let backdated = 0; // Default to 0 (not backdated)
           const currentStartDate = startDate !== undefined ? startDate : leave.startDate;
           
           if (currentStartDate) {
             const today = new Date();
             today.setHours(0, 0, 0, 0);
             const leaveStart = parseLocalDate(currentStartDate);
             if (leaveStart && leaveStart < today) {
               // ถ้าวันลาอยู่ในอดีต (ย้อนหลัง) ให้ backdated = 1
               backdated = 1;
             }
             // ถ้าวันลาเป็นวันปัจจุบันหรืออนาคต ให้ backdated = 0 (ไม่นับเป็นย้อนหลัง)
           }
           leave.backdated = backdated;
         }
         
         // แนบไฟล์ใหม่ (ถ้ามี)
         const attachmentsArr = req.files ? req.files.map(f => f.filename) : [];
         if (attachmentsArr.length > 0) {
           leave.attachments = JSON.stringify(attachmentsArr);
           leave.imgLeave = attachmentsArr.length === 1 ? attachmentsArr[0] : null;
         }
         await leaveRepo.save(leave);
         res.json({ success: true, data: leave, message: 'Leave request updated' });
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
         console.log('Days from database:', leave.days);
         console.log('StartDate from database:', leave.startDate);
         console.log('EndDate from database:', leave.endDate);

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
             } else if (process.Role === 'superadmin') {
               const superadminRepo = AppDataSource.getRepository('SuperAdmin');
               const superadmin = await superadminRepo.findOneBy({ id: leave.Repid });
               if (superadmin && superadmin.superadmin_name) name = superadmin.superadmin_name;
             } else {
               const user = await userRepo.findOneBy({ id: leave.Repid });
               console.log('User lookup:', user);
               if (user && user.User_name) name = user.User_name;
             }
           }
         }

         // Get leave type name
         let leaveTypeName = leave.leaveType;
         let leaveTypeEn = leave.leaveType;
         if (leave.leaveType) {
           const leaveTypeObj = await leaveTypeRepo.findOneBy({ id: leave.leaveType });
           if (leaveTypeObj) {
             if (leaveTypeObj.leave_type_th) leaveTypeName = leaveTypeObj.leave_type_th;
             if (leaveTypeObj.leave_type_en) leaveTypeEn = leaveTypeObj.leave_type_en;
           }
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
             id: leave.id,
             name,
             status: leave.status,
             leaveType: leave.leaveType, // id
             leaveTypeName, // th
             leaveTypeEn, // en
             startDate: leave.startDate,
             endDate: leave.endDate,
             leaveDate: leaveDate, // สำหรับ backward compatibility
             reason: leave.reason,
             rejectedReason: leave.rejectedReason,
             submittedDate,
             createdAt: leave.createdAt,
             attachments: parseAttachments(leave.attachments),
             contact: leave.contact || null,
             backdated: Number(leave.backdated),
             // เพิ่มข้อมูลที่จำเป็นสำหรับการแสดงผล
             startTime: leave.startTime,
             endTime: leave.endTime,
             days: leave.days, // ส่งค่า days จากฐานข้อมูลโดยตรง
             durationType: leave.durationType || 'day', // ถ้าไม่มีให้เป็น day
             durationHours: leave.durationHours || null,
             statusBy: leave.statusBy,
             approvedTime: leave.approvedTime,
             rejectedTime: leave.rejectedTime,
             employeeType: leave.employeeType,
             Repid: leave.Repid,
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
             const decoded = jwt.verify(token, config.server.jwtSecret);
             let user = await userRepo.findOneBy({ id: decoded.userId });
             if (user) {
               approverName = user.User_name;
             } else {
               // fallback หาใน process_check
               const processRepo = AppDataSource.getRepository('ProcessCheck');
               const processCheck = await processRepo.findOneBy({ Repid: decoded.userId });
               if (processCheck) {
                 // หาใน admin table
                 const adminRepo = AppDataSource.getRepository('Admin');
                 const admin = await adminRepo.findOneBy({ id: decoded.userId });
                 if (admin) {
                   approverName = admin.admin_name;
                 } else if (processCheck.Role === 'superadmin') {
                   const superadminRepo = AppDataSource.getRepository('SuperAdmin');
                   const superadmin = await superadminRepo.findOneBy({ id: decoded.userId });
                   approverName = superadmin ? superadmin.superadmin_name : processCheck.Email;
                 } else {
                   approverName = processCheck.Email;
                 }
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

         // Emit Socket.io event for real-time notification
         if (global.io) {
           // Emit to specific user room
           global.io.to(`user_${leave.Repid}`).emit('leaveRequestUpdated', {
             requestId: leave.id,
             status: leave.status,
             statusBy: leave.statusBy,
             employeeId: leave.Repid,
             message: status === 'approved' ? 'คำขอลาของคุณได้รับการอนุมัติ' : 'คำขอลาของคุณถูกปฏิเสธ'
           });

           // Emit to admin room for dashboard updates
           global.io.to('admin_room').emit('leaveRequestStatusChanged', {
             requestId: leave.id,
             status: leave.status,
             employeeId: leave.Repid,
             statusBy: leave.statusBy
           });
         }

         // Send LINE notification to the user
         try {
           await sendLineNotification(leave, status, approverName, rejectedReason);
         } catch (notificationError) {
           console.error('Failed to send LINE notification:', notificationError);
           // Don't fail the request if notification fails
         }

         res.json({ success: true, data: leave });
       } catch (err) {
         res.status(500).json({ success: false, message: err.message });
       }
     });

     // DELETE /api/leave-request/:id
     router.delete('/:id', async (req, res) => {
       try {
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const { id } = req.params;
         const leave = await leaveRepo.findOneBy({ id });
         if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });
         await leaveRepo.delete({ id });
         res.json({ success: true, message: 'Leave request deleted successfully' });
       } catch (err) {
         res.status(500).json({ success: false, message: err.message });
       }
     });

     // GET /api/leave-request/calendar/:year - Get approved leave requests for calendar display
     router.get('/calendar/:year', async (req, res) => {
       try {
         const { year } = req.params;
         const { month } = req.query;
         
         // Get user info from JWT token
         let currentUserId = null;
         let currentUserRole = null;
         const authHeader = req.headers.authorization;
         if (authHeader && authHeader.startsWith('Bearer ')) {
           const token = authHeader.split(' ')[1];
           try {
             const decoded = jwt.verify(token, config.server.jwtSecret);
             currentUserId = decoded.userId;
             currentUserRole = decoded.role;
           } catch (err) {
             return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
           }
         }
         
         const leaveRepo = AppDataSource.getRepository('LeaveRequest');
         const userRepo = AppDataSource.getRepository('User');
         const adminRepo = AppDataSource.getRepository('Admin');
         const superadminRepo = AppDataSource.getRepository('SuperAdmin');
         const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
         
         const { Between } = require('typeorm');
         
         // Create date range for the year
         const startOfYear = new Date(parseInt(year), 0, 1);
         const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
         
         let where = {
           status: 'approved',
           startDate: Between(startOfYear, endOfYear)
         };
         
         // If month is specified, filter by month
         if (month) {
           const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
           const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
           where = {
             status: 'approved',
             startDate: Between(startOfMonth, endOfMonth)
           };
         }
         
         // Filter by user role - admin/superadmin can see all, user can only see their own
         if (currentUserRole === 'user') {
           where.Repid = currentUserId;
         }
         
         const approvedLeaves = await leaveRepo.find({
           where,
           order: { startDate: 'ASC' }
         });
         
         const result = await Promise.all(approvedLeaves.map(async (leave) => {
           let user = null;
           let leaveTypeObj = null;
           
           // Find user information
           if (leave.Repid) {
             user = await userRepo.findOneBy({ id: leave.Repid });
             if (!user) {
               // Try admin
               const admin = await adminRepo.findOneBy({ id: leave.Repid });
               if (admin) {
                 user = { 
                   User_name: admin.admin_name, 
                   department: admin.department, 
                   position: admin.position 
                 };
               } else {
                 // Try superadmin
                 const superadmin = await superadminRepo.findOneBy({ id: leave.Repid });
                 if (superadmin) {
                   user = { 
                     User_name: superadmin.superadmin_name, 
                     department: superadmin.department, 
                     position: superadmin.position 
                   };
                 }
               }
             } else {
               user = { 
                 User_name: user.User_name, 
                 department: user.department, 
                 position: user.position 
               };
             }
           }
           
           // Get leave type information
           if (leave.leaveType) {
             leaveTypeObj = await leaveTypeRepo.findOneBy({ id: leave.leaveType });
           }
           
           // Calculate duration
           let duration = '';
           let durationType = '';
           if (leave.startTime && leave.endTime) {
             // Calculate hours
             const [sh, sm] = leave.startTime.split(':').map(Number);
             const [eh, em] = leave.endTime.split(':').map(Number);
             let start = sh + (sm || 0) / 60;
             let end = eh + (em || 0) / 60;
             let diff = end - start;
             if (diff < 0) diff += 24; // Cross day
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
             userId: leave.Repid,
             userName: user ? user.User_name : 'Unknown',
             department: user ? user.department : '',
             position: user ? user.position : '',
             leaveType: leaveTypeObj ? leaveTypeObj.leave_type_th : leave.leaveType,
             leaveTypeEn: leaveTypeObj ? leaveTypeObj.leave_type_en : leave.leaveType,
             startDate: leave.startDate,
             endDate: leave.endDate,
             startTime: leave.startTime,
             endTime: leave.endTime,
             duration,
             durationType,
             reason: leave.reason,
             status: leave.status,
             createdAt: leave.createdAt
           };
         }));
         
         res.json({ 
           status: 'success', 
           data: result,
           message: 'Calendar leave data fetched successfully'
         });
         
       } catch (err) {
         res.status(500).json({ 
           status: 'error', 
           message: err.message 
         });
       }
     });
     return router;
   };
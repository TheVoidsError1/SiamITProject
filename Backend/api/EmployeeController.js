const express = require('express');
const bcrypt = require('bcrypt');

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: แสดงข้อมูลผู้ใช้ทั้งหมด (admin/user)
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: รายการผู้ใช้ทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       position:
 *                         type: string
 *                       department:
 *                         type: string
 *                       status:
 *                         type: string
 *                 message:
 *                   type: string
 */
module.exports = (AppDataSource) => {
  const router = express.Router();

  router.get('/employees', async (req, res) => {
    try {
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const adminRepo = AppDataSource.getRepository('admin');
      const userRepo = AppDataSource.getRepository('User');

      // ดึง process_check ทั้งหมด
      const allProcess = await processRepo.find();
      console.log('allProcess:', allProcess); // log ข้อมูลทั้งหมด
      const results = [];

      for (const proc of allProcess) {
        let profile = null;
        let name = '';
        let position = '';
        let department = '';
        let id = '';
        let role = proc.Role;
        if (proc.Role === 'admin') {
          profile = await adminRepo.findOneBy({ id: proc.Repid });
          if (profile) {
            name = profile.admin_name;
            // ดึงชื่อ position และ department
            const posEntity = await AppDataSource.getRepository('Position').findOne({ where: { id: profile.position } });
            const deptEntity = await AppDataSource.getRepository('Department').findOne({ where: { id: profile.department } });
            position = posEntity ? posEntity.position_name : profile.position;
            department = deptEntity ? deptEntity.department_name : profile.department;
            id = profile.id;
          }
        } else if (proc.Role === 'user') {
          profile = await userRepo.findOneBy({ id: proc.Repid });
          if (profile) {
            name = profile.User_name;
            // ดึงชื่อ position และ department
            const posEntity = await AppDataSource.getRepository('Position').findOne({ where: { id: profile.position } });
            const deptEntity = await AppDataSource.getRepository('Department').findOne({ where: { id: profile.department } });
            position = posEntity ? posEntity.position_name : profile.position;
            department = deptEntity ? deptEntity.department_name : profile.department;
            id = profile.id;
          }
        }
        // ถ้าไม่มี profile ให้ข้าม
        if (!profile) continue;

        // --- เพิ่มส่วนนี้ ---
        // 1. ดึง leave quota ตาม position
        let totalLeaveDays = 0;
        try {
          const leaveQuotaRepo = AppDataSource.getRepository('LeaveQuota');
          const posEntity = await AppDataSource.getRepository('Position').findOne({ where: { position_name: position } });
          let quota = null;
          if (posEntity) {
            quota = await leaveQuotaRepo.findOneBy({ positionId: posEntity.id });
          }
          if (quota) {
            totalLeaveDays = (quota.sick || 0) + (quota.vacation || 0) + (quota.personal || 0);
          }
        } catch (e) { totalLeaveDays = 0; }

        // 2. ดึง leaveRequest ที่อนุมัติของ user/admin นี้
        let usedLeaveDays = 0;
        try {
          const leaveRepo = AppDataSource.getRepository('LeaveRequest');
          const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
          const approvedLeaves = await leaveRepo.find({ where: { Repid: id, status: 'approved' } });
          for (const lr of approvedLeaves) {
            // หา leaveTypeName
            let leaveTypeName = lr.leaveType;
            if (leaveTypeName && leaveTypeName.length > 20) {
              const leaveTypeEntity = await leaveTypeRepo.findOneBy({ id: leaveTypeName });
              if (leaveTypeEntity && leaveTypeEntity.leave_type) {
                leaveTypeName = leaveTypeEntity.leave_type;
              }
            }
            // เฉพาะประเภท sick, vacation, personal
            if (["sick", "ลาป่วย", "vacation", "ลาพักผ่อน", "personal", "ลากิจ"].includes(leaveTypeName)) {
              if (leaveTypeName === "personal" || leaveTypeName === "ลากิจ") {
                // personal: อาจเป็นชั่วโมงหรือวัน
                if (lr.startTime && lr.endTime) {
                  // ชั่วโมง
                  const [sh, sm] = lr.startTime.split(":").map(Number);
                  const [eh, em] = lr.endTime.split(":").map(Number);
                  let start = sh + (sm || 0) / 60;
                  let end = eh + (em || 0) / 60;
                  let diff = end - start;
                  if (diff < 0) diff += 24;
                  usedLeaveDays += diff / 9; // 1 วัน = 9 ชม.
                } else if (lr.startDate && lr.endDate) {
                  // วัน
                  const start = new Date(lr.startDate);
                  const end = new Date(lr.endDate);
                  let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  if (days < 0 || isNaN(days)) days = 0;
                  usedLeaveDays += days;
                }
              } else {
                // sick, vacation: วันเท่านั้น
                if (lr.startDate && lr.endDate) {
                  const start = new Date(lr.startDate);
                  const end = new Date(lr.endDate);
                  let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  if (days < 0 || isNaN(days)) days = 0;
                  usedLeaveDays += days;
                }
              }
            }
          }
        } catch (e) { usedLeaveDays = 0; }
        usedLeaveDays = Math.round(usedLeaveDays * 100) / 100;
        // --- จบส่วนเพิ่ม ---

        results.push({
          id,
          name,
          email: proc.Email,
          position,
          department,
          status: proc.Role,
          role,
          usedLeaveDays,
          totalLeaveDays
        });
      }
      res.json({ success: true, data: results, message: 'ดึงข้อมูลผู้ใช้ทั้งหมดสำเร็จ' });
    } catch (err) {
      res.status(500).json({ success: false, data: null, message: err.message });
    }
  });

  // Get employee/admin profile by ID
  router.get('/employee/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const adminRepo = AppDataSource.getRepository('admin');
      const userRepo = AppDataSource.getRepository('User');
      const departmentRepo = AppDataSource.getRepository('Department');
      const positionRepo = AppDataSource.getRepository('Position');
      const leaveQuotaRepo = AppDataSource.getRepository('LeaveQuota');
      const leaveTypeRepo = AppDataSource.getRepository('LeaveType');
      const leaveRequestRepo = AppDataSource.getRepository('LeaveRequest');

      // Try to find in admin first
      let profile = await adminRepo.findOne({ where: { id } });
      let role = 'admin';
      if (!profile) {
        profile = await userRepo.findOne({ where: { id } });
        role = 'employee';
      }
      if (!profile) {
        return res.status(404).json({ success: false, message: 'User/Admin not found' });
      }

      // Find processCheck for email (if exists)
      const processCheck = await processRepo.findOne({ where: { Repid: id } });
      const email = processCheck ? processCheck.Email : (profile.email || '');

      // Get department and position names (i18n key or readable)
      let department = '';
      let position = '';
      let positionId = '';
      if (profile.department) {
        const deptEntity = await departmentRepo.findOne({ where: { id: profile.department } });
        department = deptEntity ? deptEntity.department_name : profile.department;
      }
      if (profile.position) {
        const posEntity = await positionRepo.findOne({ where: { id: profile.position } });
        position = posEntity ? posEntity.position_name : profile.position;
        positionId = profile.position;
      }

      // Password field (for future editing)
      const password = processCheck ? processCheck.Password : '';

      // --- New: Leave quota and usage summary ---
      let leaveSummary = [];
      if (positionId) {
        // 1. Get all leave types
        const leaveTypes = await leaveTypeRepo.find();
        // 2. Get all quotas for this position
        const quotas = await leaveQuotaRepo.find({ where: { positionId } });
        // 3. Get all approved leave requests for this user
        const approvedLeaves = await leaveRequestRepo.find({ where: { Repid: id, status: 'approved' } });
        for (const leaveType of leaveTypes) {
          // Find quota for this leave type
          const quotaRow = quotas.find(q => q.leaveTypeId === leaveType.id);
          const quota = quotaRow ? quotaRow.quota : 0;
          // Calculate used leave for this type
          let used = 0;
          for (const lr of approvedLeaves) {
            let leaveTypeName = lr.leaveType;
            if (leaveTypeName && leaveTypeName.length > 20) {
              const leaveTypeEntity = await leaveTypeRepo.findOneBy({ id: leaveTypeName });
              if (leaveTypeEntity && leaveTypeEntity.leave_type) {
                leaveTypeName = leaveTypeEntity.leave_type;
              }
            }
            if (leaveTypeName === leaveType.leave_type) {
              // Personal leave: may be by hour or day
              if (leaveTypeName === 'personal' || leaveTypeName === 'ลากิจ') {
                if (lr.startTime && lr.endTime) {
                  const [sh, sm] = lr.startTime.split(":").map(Number);
                  const [eh, em] = lr.endTime.split(":").map(Number);
                  let start = sh + (sm || 0) / 60;
                  let end = eh + (em || 0) / 60;
                  let diff = end - start;
                  if (diff < 0) diff += 24;
                  used += diff / 9; // 1 day = 9 hours
                } else if (lr.startDate && lr.endDate) {
                  const start = new Date(lr.startDate);
                  const end = new Date(lr.endDate);
                  let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  if (days < 0 || isNaN(days)) days = 0;
                  used += days;
                }
              } else {
                // Other types: by day
                if (lr.startDate && lr.endDate) {
                  const start = new Date(lr.startDate);
                  const end = new Date(lr.endDate);
                  let days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  if (days < 0 || isNaN(days)) days = 0;
                  used += days;
                }
              }
            }
          }
          leaveSummary.push({ type: leaveType.leave_type, quota, used: Math.round(used * 100) / 100 });
        }
      }
      // --- End leave summary ---

      res.json({
        success: true,
        data: {
          id,
          name: profile.admin_name || profile.User_name || '',
          email,
          password,
          position,
          department,
          role,
          leaveSummary
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update employee/admin profile by ID
  router.put('/employee/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, password, position, department } = req.body;
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const adminRepo = AppDataSource.getRepository('admin');
      const userRepo = AppDataSource.getRepository('User');
      const departmentRepo = AppDataSource.getRepository('Department');
      const positionRepo = AppDataSource.getRepository('Position');

      // Try to find in admin first
      let profile = await adminRepo.findOne({ where: { id } });
      let role = 'admin';
      if (!profile) {
        profile = await userRepo.findOne({ where: { id } });
        role = 'employee';
      }
      if (!profile) {
        return res.status(404).json({ success: false, message: 'User/Admin not found' });
      }

      // Update fields
      if (role === 'admin') {
        if (name !== undefined) profile.admin_name = name;
        if (position !== undefined) profile.position = position;
        if (department !== undefined) profile.department = department;
        await adminRepo.save(profile);
      } else {
        if (name !== undefined) profile.User_name = name;
        if (position !== undefined) profile.position = position;
        if (department !== undefined) profile.department = department;
        await userRepo.save(profile);
      }

      // Update processCheck for email and password
      const processCheck = await processRepo.findOne({ where: { Repid: id } });
      if (processCheck) {
        if (email !== undefined) processCheck.Email = email;
        if (password !== undefined) {
          const saltRounds = 10;
          processCheck.Password = await bcrypt.hash(password, saltRounds);
        }
        await processRepo.save(processCheck);
      }

      // Get department and position names
      let departmentName = '';
      let positionName = '';
      if (profile.department) {
        const deptEntity = await departmentRepo.findOne({ where: { id: profile.department } });
        departmentName = deptEntity ? deptEntity.department_name : profile.department;
      }
      if (profile.position) {
        const posEntity = await positionRepo.findOne({ where: { id: profile.position } });
        positionName = posEntity ? posEntity.position_name : profile.position;
      }

      res.json({
        success: true,
        data: {
          id,
          name: profile.admin_name || profile.User_name || '',
          email: processCheck ? processCheck.Email : (profile.email || ''),
          password: processCheck ? processCheck.Password : '',
          position: positionName,
          department: departmentName,
          role,
          usedLeaveDays: null,
          totalLeaveDays: null
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
};

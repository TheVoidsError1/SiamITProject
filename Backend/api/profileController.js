const bcrypt = require('bcryptjs');

class ProfileController {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  // PUT /profile/:id - Update profile (user or admin) by process_check id
  async updateProfile(req, res) {
    try {
      const { id } = req.params; // process_check id
      const processRepo = this.dataSource.getRepository('ProcessCheck');
      const userRepo = this.dataSource.getRepository('User');
      const adminRepo = this.dataSource.getRepository('admin');
      const { User_name, position, department, email, password } = req.body;

      // Find process_check record
      const processUser = await processRepo.findOneBy({ id: parseInt(id) });
      if (!processUser) {
        return res.status(404).json({ success: false, message: 'ProcessCheck record not found' });
      }

      let updatedProfile = null;
      if (processUser.Role === 'employee' || processUser.Role === 'user' || processUser.Role === 'intern') {
        // Update users table
        const user = await userRepo.findOneBy({ id: processUser.Repid });
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (User_name) user.User_name = User_name;
        if (position) user.position = position;
        if (department) user.department = department;
        updatedProfile = await userRepo.save(user);
      } else if (processUser.Role === 'admin') {
        // Update admin table
        const admin = await adminRepo.findOneBy({ admin_id: processUser.Repid });
        if (!admin) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        if (User_name) admin.admin_name = User_name;
        // สามารถเพิ่ม field อื่น ๆ ของ admin ได้ที่นี่
        updatedProfile = await adminRepo.save(admin);
      } else {
        return res.status(400).json({ success: false, message: 'Unknown role' });
      }

      // Update email and password in process_check if provided
      let changed = false;
      if (email) {
        processUser.Email = email;
        changed = true;
      }
      if (password) {
        processUser.Password = await bcrypt.hash(password, 10);
        changed = true;
      }
      if (changed) {
        await processRepo.save(processUser);
      }

      res.json({
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = ProfileController; 
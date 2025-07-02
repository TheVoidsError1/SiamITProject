const { DataSource } = require('typeorm');

class UserController {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.userRepository = dataSource.getRepository('User');
  }

  // GET /users - Get all users (from process_check as source of truth)
  async getAllUsers(req, res) {
    try {
      const processRepo = this.dataSource.getRepository('ProcessCheck');
      const userRepo = this.dataSource.getRepository('User');
      const adminRepo = this.dataSource.getRepository('admin');
      const processChecks = await processRepo.find();
      const result = [];
      for (const pc of processChecks) {
        let name = '-';
        let position = '-';
        let department = '-';
        if (pc.Role === 'admin') {
          const admin = await adminRepo.findOneBy({ admin_id: pc.Repid });
          name = admin ? admin.admin_name : '-';
        } else if (pc.Role === 'employee' || pc.Role === 'user' || pc.Role === 'intern') {
          const user = await userRepo.findOneBy({ User_id: pc.Repid });
          name = user ? user.User_name : '-';
          position = user ? user.position : '-';
          department = user ? user.department : '-';
        }
        result.push({
          id: pc.id,
          name,
          email: pc.Email,
          role: pc.Role,
          position,
          department
        });
      }
      res.json({
        success: true,
        data: result,
        message: 'All users (from process_check) retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /users/:id - Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      if (isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, message: 'Invalid user id' });
      }
      const user = await this.userRepository.findOne({ where: { User_id: parseInt(id) } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const processCheck = await this.dataSource.getRepository('ProcessCheck').findOne({ where: { Repid: user.User_id } });
      res.json({
        success: true,
        data: {
          name: user.User_name,
          position: user.position,
          department: user.department,
          email: processCheck ? processCheck.Email : null
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // // POST /users - Create new user
  // async createUser(req, res) {
  //   try {
  //     const { User_name, position, department } = req.body;
  //     if (!User_name || !position || !department) {
  //       return res.status(400).json({ success: false, message: 'User_name, position, and department are required' });
  //     }
  //     const newUser = this.userRepository.create({ User_name, position, department });
  //     const savedUser = await this.userRepository.save(newUser);
  //     res.status(201).json({ success: true, data: savedUser, message: 'User created successfully' });
  //   } catch (error) {
  //     res.status(500).json({ success: false, message: error.message });
  //   }
  // }

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: Update user or admin profile and process_check info by process_check id
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: The id from process_check table
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               User_name:
   *                 type: string
   *               position:
   *                 type: string
   *               department:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *       404:
   *         description: Not found
   *       500:
   *         description: Server error
   */
  // PUT /users/:id - Update user based on process_check id, using Role and Repid
  async updateUser(req, res) {
    try {
      const { id } = req.params; // id from process_check
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
      if (processUser.Role === 'employee' || processUser.Role === 'user') {
        // Update users table
        const user = await userRepo.findOneBy({ User_id: processUser.Repid });
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
        // Admin table doesn't have position and department fields, so skip them
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
        const bcrypt = require('bcryptjs');
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

  // DELETE /users/:id - Delete user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await this.userRepository.findOne({ where: { User_id: parseInt(id) } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      // Delete matching process check
      const processCheckRepo = this.dataSource.getRepository('ProcessCheck');
      const processCheck = await processCheckRepo.findOne({ where: { Repid: user.User_id } });
      if (processCheck) {
        await processCheckRepo.remove(processCheck);
      }
      await this.userRepository.remove(user);
      res.json({ success: true, message: 'User and related process check deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = UserController; 
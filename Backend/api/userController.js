const { DataSource } = require('typeorm');

class UserController {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.userRepository = dataSource.getRepository('User');
  }

  // GET /users - Get all users
  async getAllUsers(req, res) {
    try {
      // Get all users
      const users = await this.userRepository.find();
      // Get all process checks
      const processChecks = await this.dataSource.getRepository('ProcessCheck').find();
      // Map by id for quick lookup
      const processCheckMap = {};
      for (const pc of processChecks) {
        processCheckMap[pc.id] = pc;
      }
      // Combine data
      const result = users.map(user => {
        const pc = processCheckMap[user.User_id];
        return {
          name: user.User_name,
          position: user.position,
          department: user.department,
          email: pc ? pc.Email : null
        };
      });
      res.json({
        success: true,
        data: result,
        message: 'Users with emails retrieved successfully'
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
      const processCheck = await this.dataSource.getRepository('ProcessCheck').findOne({ where: { id: user.User_id } });
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

  // PUT /users/:id - Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      if (isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, message: 'Invalid user id' });
      }
      const { User_name, position, department, email } = req.body;
      const user = await this.userRepository.findOne({ where: { User_id: parseInt(id) } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      if (User_name) user.User_name = User_name;
      if (position) user.position = position;
      if (department) user.department = department;
      const updatedUser = await this.userRepository.save(user);
      // Update email in ProcessCheck if provided
      let processCheck = await this.dataSource.getRepository('ProcessCheck').findOne({ where: { id: updatedUser.User_id } });
      if (processCheck && email) {
        processCheck.Email = email;
        await this.dataSource.getRepository('ProcessCheck').save(processCheck);
      }
      res.json({
        success: true,
        data: {
          name: updatedUser.User_name,
          position: updatedUser.position,
          department: updatedUser.department,
          email: processCheck ? processCheck.Email : null
        },
        message: 'User updated successfully'
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
      const processCheck = await processCheckRepo.findOne({ where: { id: user.User_id } });
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
const bcrypt = require('bcryptjs');

class LineLinkingController {
  // Get user by LINE user ID
  static async getUserByLineId(AppDataSource, lineUserId) {
    try {
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const user = await processRepo.findOneBy({ lineUserId });
      return user;
    } catch (error) {
      console.error('Error getting user by LINE ID:', error);
      return null;
    }
  }

  // Link LINE user to ProcessCheck account
  static async linkUser(AppDataSource, lineUserId, email, password) {
    try {
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      
      // Find user by email
      const processCheck = await processRepo.findOneBy({ Email: email });
      if (!processCheck) {
        return { success: false, error: 'User not found' };
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, processCheck.Password);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid password' };
      }
      
      // Check if LINE user ID is already linked to another user
      const existingLink = await processRepo.findOneBy({ lineUserId });
      if (existingLink) {
        return { success: false, error: 'This LINE account is already linked to another user' };
      }
      
      // Link the LINE user ID
      processCheck.lineUserId = lineUserId;
      await processRepo.save(processCheck);
      
      return { 
        success: true, 
        message: 'LINE account linked successfully',
        user: {
          id: processCheck.id,
          email: processCheck.Email,
          role: processCheck.Role
        }
      };
      
    } catch (error) {
      console.error('Error linking LINE user:', error);
      return { success: false, error: error.message };
    }
  }

  // Unlink LINE user
  static async unlinkUser(AppDataSource, lineUserId) {
    try {
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const processCheck = await processRepo.findOneBy({ lineUserId });
      
      if (!processCheck) {
        return { success: false, error: 'Linked user not found' };
      }
      
      processCheck.lineUserId = null;
      await processRepo.save(processCheck);
      
      return { 
        success: true, 
        message: 'LINE account unlinked successfully' 
      };
      
    } catch (error) {
      console.error('Error unlinking LINE user:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = LineLinkingController; 
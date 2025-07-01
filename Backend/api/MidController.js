const express = require('express');

module.exports = (AppDataSource) => {
  const router = express.Router();

  /**
   * @swagger
   * /api/mid/delete-user:
   *   delete:
   *     summary: Delete a user or admin from process_check and the corresponding table
   *     tags: [Mid]
   *     parameters:
   *       - in: query
   *         name: id
   *         schema:
   *           type: integer
   *         required: true
   *         description: The id of the process_check record to delete
   *     responses:
   *       200:
   *         description: User/admin deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 deleted:
   *                   type: object
   *       404:
   *         description: Not found
   *       500:
   *         description: Server error
   */
  router.delete('/mid/delete-user', async (req, res) => {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, message: 'Missing id parameter' });
      const processRepo = AppDataSource.getRepository('ProcessCheck');
      const userRepo = AppDataSource.getRepository('User');
      const adminRepo = AppDataSource.getRepository('admin');
      const processUser = await processRepo.findOneBy({ id: parseInt(id) });
      if (!processUser) return res.status(404).json({ success: false, message: 'ProcessCheck record not found' });
      let deleted = { processCheck: processUser };
      if (processUser.Role === 'employee' || processUser.Role === 'user') {
        // Delete from users table
        const user = await userRepo.findOneBy({ User_id: processUser.Repid });
        if (user) {
          await userRepo.remove(user);
          deleted.user = user;
        }
      } else if (processUser.Role === 'admin') {
        // Delete from admin table
        const admin = await adminRepo.findOneBy({ admin_id: processUser.Repid });
        if (admin) {
          await adminRepo.remove(admin);
          deleted.admin = admin;
        }
      }
      // Delete from process_check
      await processRepo.remove(processUser);
      res.json({ success: true, message: 'User/admin deleted successfully', deleted });
    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

module.exports = (AppDataSource) => {

  // GET all custom holidays
  router.get('/custom-holidays', async (req, res) => {
      try {
          const customHolidayRepository = AppDataSource.getRepository('CustomHoliday');
          const holidays = await customHolidayRepository.find({
              order: {
                  date: 'ASC'
              }
          });
          
          res.json({
              status: 'success',
              data: holidays
          });
      } catch (error) {
          console.error('Error fetching custom holidays:', error);
          res.status(500).json({
              status: 'error',
              message: 'Failed to fetch custom holidays'
          });
      }
  });

  // GET custom holiday by ID
  router.get('/custom-holidays/:id', async (req, res) => {
      try {
          const { id } = req.params;
          const customHolidayRepository = AppDataSource.getRepository('CustomHoliday');
          const holiday = await customHolidayRepository.findOne({ where: { id } });
          
          if (!holiday) {
              return res.status(404).json({
                  status: 'error',
                  message: 'Custom holiday not found'
              });
          }
          
          res.json({
              status: 'success',
              data: holiday
          });
      } catch (error) {
          console.error('Error fetching custom holiday:', error);
          res.status(500).json({
              status: 'error',
              message: 'Failed to fetch custom holiday'
          });
      }
  });

  // Create new custom holiday
  router.post('/custom-holidays', async (req, res) => {
    try {
      const { title, description, date } = req.body;
      const createdBy = req.user?.userId || 'system';
      
      const customHolidayRepo = AppDataSource.getRepository('CustomHoliday');
      const newHoliday = customHolidayRepo.create({
        title,
        description,
        date,
        createdBy
      });
      
      const savedHoliday = await customHolidayRepo.save(newHoliday);
      
      // Emit Socket.io event for real-time notification
      if (global.io) {
        global.io.emit('newCompanyEvent', {
          id: savedHoliday.id,
          title: savedHoliday.title,
          description: savedHoliday.description,
          date: savedHoliday.date,
          createdAt: savedHoliday.createdAt,
          createdBy: savedHoliday.createdBy,
          type: 'company'
        });
      }
      
      res.json({ status: 'success', data: savedHoliday, message: 'Custom holiday created successfully' });
    } catch (err) {
      console.error('Error creating custom holiday:', err);
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  // Update custom holiday
  router.put('/custom-holidays/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, date } = req.body;
      
      const customHolidayRepo = AppDataSource.getRepository('CustomHoliday');
      const holiday = await customHolidayRepo.findOneBy({ id });
      
      if (!holiday) {
        return res.status(404).json({ status: 'error', data: null, message: 'Custom holiday not found' });
      }
      
      // Update fields
      holiday.title = title || holiday.title;
      holiday.description = description || holiday.description;
      holiday.date = date || holiday.date;
      
      const updatedHoliday = await customHolidayRepo.save(holiday);
      
      // Emit Socket.io event for real-time notification
      if (global.io) {
        global.io.emit('companyEventUpdated', {
          id: updatedHoliday.id,
          title: updatedHoliday.title,
          description: updatedHoliday.description,
          date: updatedHoliday.date,
          createdAt: updatedHoliday.createdAt,
          createdBy: updatedHoliday.createdBy,
          type: 'company'
        });
      }
      
      res.json({ status: 'success', data: updatedHoliday, message: 'Custom holiday updated successfully' });
    } catch (err) {
      console.error('Error updating custom holiday:', err);
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  // Delete custom holiday
  router.delete('/custom-holidays/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const customHolidayRepo = AppDataSource.getRepository('CustomHoliday');
      const holiday = await customHolidayRepo.findOneBy({ id });
      
      if (!holiday) {
        return res.status(404).json({ status: 'error', data: null, message: 'Custom holiday not found' });
      }
      
      await customHolidayRepo.delete({ id });
      
      // Emit Socket.io event for real-time notification
      if (global.io) {
        global.io.emit('companyEventDeleted', {
          id: holiday.id,
          title: holiday.title,
          description: holiday.description,
          date: holiday.date,
          createdAt: holiday.createdAt,
          createdBy: holiday.createdBy,
          type: 'company'
        });
      }
      
      res.json({ status: 'success', message: 'Custom holiday deleted successfully' });
    } catch (err) {
      console.error('Error deleting custom holiday:', err);
      res.status(500).json({ status: 'error', data: null, message: err.message });
    }
  });

  // GET custom holidays by date range
  router.get('/custom-holidays/range', async (req, res) => {
      try {
          const { startDate, endDate } = req.query;
          
          if (!startDate || !endDate) {
              return res.status(400).json({
                  status: 'error',
                  message: 'Start date and end date are required'
              });
          }
          
          const customHolidayRepository = AppDataSource.getRepository('CustomHoliday');
        const holidays = await customHolidayRepository
            .createQueryBuilder('holiday')
            .where('holiday.date >= :startDate', { startDate })
            .andWhere('holiday.date <= :endDate', { endDate })
            .orderBy('holiday.date', 'ASC')
            .getMany();
        
        res.json({
            status: 'success',
            data: holidays
        });
    } catch (error) {
        console.error('Error fetching custom holidays by range:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch custom holidays by range'
        });
    }
});

  // GET custom holidays by year
  router.get('/custom-holidays/year/:year', async (req, res) => {
      try {
          const { year } = req.params;
          
          if (!year || isNaN(year)) {
              return res.status(400).json({
                  status: 'error',
                  message: 'Valid year is required'
              });
          }
          
          const startDate = `${year}-01-01`;
          const endDate = `${year}-12-31`;
          
          const customHolidayRepository = AppDataSource.getRepository('CustomHoliday');
        const holidays = await customHolidayRepository
            .createQueryBuilder('holiday')
            .where('holiday.date >= :startDate', { startDate })
            .andWhere('holiday.date <= :endDate', { endDate })
            .orderBy('holiday.date', 'ASC')
            .getMany();
        
        res.json({
            status: 'success',
            data: holidays
        });
    } catch (error) {
        console.error('Error fetching custom holidays by year:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch custom holidays by year'
        });
    }
});

  // GET custom holidays by year and month
  router.get('/custom-holidays/year/:year/month/:month', async (req, res) => {
      try {
          const { year, month } = req.params;
          
          if (!year || isNaN(year) || !month || isNaN(month)) {
              return res.status(400).json({
                  status: 'error',
                  message: 'Valid year and month are required'
              });
          }
          
          // Validate month is between 1-12
          if (month < 1 || month > 12) {
              return res.status(400).json({
                  status: 'error',
                  message: 'Month must be between 1 and 12'
              });
          }
          
          const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
          const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
          
          const customHolidayRepository = AppDataSource.getRepository('CustomHoliday');
        const holidays = await customHolidayRepository
            .createQueryBuilder('holiday')
            .where('holiday.date >= :startDate', { startDate })
            .andWhere('holiday.date <= :endDate', { endDate })
            .orderBy('holiday.date', 'ASC')
            .getMany();
        
        res.json({
            status: 'success',
            data: holidays
        });
    } catch (error) {
        console.error('Error fetching custom holidays by year and month:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch custom holidays by year and month'
        });
    }
});

  return router;
};

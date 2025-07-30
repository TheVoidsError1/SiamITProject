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

// POST create new custom holiday
router.post('/custom-holidays', authMiddleware, async (req, res) => {
    try {
        const { title, description, date, type } = req.body;
        
        // Validate required fields
        if (!title || !date) {
            return res.status(400).json({
                status: 'error',
                message: 'Title and date are required'
            });
        }
        
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                status: 'error',
                message: 'Date must be in YYYY-MM-DD format'
            });
        }
        
        const customHolidayRepository = AppDataSource.getRepository('CustomHoliday');
        
        // Check if holiday already exists for this date
        const existingHoliday = await customHolidayRepository.findOne({
            where: { date }
        });
        
        if (existingHoliday) {
            return res.status(409).json({
                status: 'error',
                message: 'A custom holiday already exists for this date'
            });
        }
        
        // Get superadmin name from superadmin table via ProcessCheck
        let createdBy = 'system';
        if (req.user.userId) {
            const processRepo = AppDataSource.getRepository('ProcessCheck');
            const processCheck = await processRepo.findOne({ where: { Repid: req.user.userId } });
            if (processCheck && processCheck.Repid) {
                const superAdminRepo = AppDataSource.getRepository('SuperAdmin');
                const superAdmin = await superAdminRepo.findOne({ where: { id: processCheck.Repid } });
                if (superAdmin && superAdmin.superadmin_name) {
                    createdBy = superAdmin.superadmin_name;
                }
            }
        }
        
        const newHoliday = customHolidayRepository.create({
            title,
            description: description || '',
            date,
            type: type || 'company',
            createdBy: createdBy
        });
        
        const savedHoliday = await customHolidayRepository.save(newHoliday);
        
        res.status(201).json({
            status: 'success',
            message: 'Custom holiday created successfully',
            data: savedHoliday
        });
    } catch (error) {
        console.error('Error creating custom holiday:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create custom holiday'
        });
    }
});

  // PUT update custom holiday
  router.put('/custom-holidays/:id', authMiddleware, async (req, res) => {
      try {
          const { id } = req.params;
          const { title, description, date, type } = req.body;
          
          const customHolidayRepository = AppDataSource.getRepository('CustomHoliday');
          const holiday = await customHolidayRepository.findOne({ where: { id } });
        
        if (!holiday) {
            return res.status(404).json({
                status: 'error',
                message: 'Custom holiday not found'
            });
        }
        
        // Validate date format if provided
        if (date) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Date must be in YYYY-MM-DD format'
                });
            }
            
            // Check if new date conflicts with existing holiday (excluding current holiday)
            const existingHoliday = await customHolidayRepository.findOne({
                where: { date, id: { $ne: id } }
            });
            
            if (existingHoliday) {
                return res.status(409).json({
                    status: 'error',
                    message: 'A custom holiday already exists for this date'
                });
            }
        }
        
        // Update fields
        if (title !== undefined) holiday.title = title;
        if (description !== undefined) holiday.description = description;
        if (date !== undefined) holiday.date = date;
        if (type !== undefined) holiday.type = type;
        
        // Update createdBy to show who last modified it
        let updatedBy = holiday.createdBy;
        if (req.user.userId) {
            const processRepo = AppDataSource.getRepository('ProcessCheck');
            const processCheck = await processRepo.findOne({ where: { Repid: req.user.userId } });
            if (processCheck && processCheck.Repid) {
                const superAdminRepo = AppDataSource.getRepository('SuperAdmin');
                const superAdmin = await superAdminRepo.findOne({ where: { id: processCheck.Repid } });
                if (superAdmin && superAdmin.superadmin_name) {
                    updatedBy = superAdmin.superadmin_name;
                }
            }
        }
        holiday.createdBy = updatedBy;
        
        const updatedHoliday = await customHolidayRepository.save(holiday);
        
        res.json({
            status: 'success',
            message: 'Custom holiday updated successfully',
            data: updatedHoliday
        });
    } catch (error) {
        console.error('Error updating custom holiday:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update custom holiday'
        });
    }
});

  // DELETE custom holiday
  router.delete('/custom-holidays/:id', authMiddleware, async (req, res) => {
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
        
        await customHolidayRepository.remove(holiday);
        
        res.json({
            status: 'success',
            message: 'Custom holiday deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting custom holiday:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete custom holiday'
        });
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

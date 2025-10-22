const line = require('@line/bot-sdk');
const axios = require('axios');
const { Between, NotNull } = require('typeorm');
const { 
  toDayHour, 
  calculateDaysBetween, 
  convertTimeRangeToDecimal,
  convertToMinutes,
  getLeaveUsageSummary
} = require('../utils');

// LINE Bot configuration using environment variables
const config = {
  channelAccessToken: process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_BOT_CHANNEL_SECRET
};

// Debug: Log LINE Bot configuration (without exposing sensitive data)
console.log('LINE Bot Configuration Debug:');
console.log('Channel Access Token exists:', !!process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN);
console.log('Channel Secret exists:', !!process.env.LINE_BOT_CHANNEL_SECRET);
console.log('Channel Access Token length:', process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN ? process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN.length : 0);
console.log('Channel Secret length:', process.env.LINE_BOT_CHANNEL_SECRET ? process.env.LINE_BOT_CHANNEL_SECRET.length : 0);

// Helper function to get API base URL
const getApiBaseUrl = () => {
  return process.env.VITE_API_BASE_URL || config.server.apiBaseUrl;
};

const client = new line.Client(config);

class LineController {
  // Webhook endpoint for LINE to send messages
  static async webhook(req, res) {
    const events = req.body.events;
    
    try {
      await Promise.all(events.map(event => LineController.handleEvent(event)));
      res.json({ success: true });
    } catch (err) {
      console.error('LINE webhook error:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // Handle incoming LINE events
  static async handleEvent(event) {
    // Handle different event types
    switch (event.type) {
      case 'message':
        if (event.message.type === 'text') {
          return await this.handleTextMessage(event);
        }
        break;
      case 'follow':
        return await this.handleFollow(event);
      default:
        return Promise.resolve(null);
    }
  }

  // Handle text messages
  static async handleTextMessage(event) {
    const text = event.message.text;
    const userId = event.source.userId;
    const replyToken = event.replyToken;

    // Debug: Log the webhook data to see what we're receiving
    console.log('=== LINE Webhook Debug ===');
    console.log('Full event:', JSON.stringify(event, null, 2));
    console.log('Text:', text);
    console.log('User ID from source:', userId);
    console.log('User ID type:', typeof userId);
    console.log('User ID length:', userId ? userId.length : 0);
    console.log('Source object:', event.source);
    console.log('========================');

    try {
      const response = await this.processUserMessage(text, userId);
      await client.replyMessage(replyToken, response);
    } catch (error) {
      console.error('Error processing LINE message:', error);
      await client.replyMessage(replyToken, {
        type: 'text',
        text: 'Sorry, something went wrong. Please try again.'
      });
    }
  }

  // Handle follow events (when user adds the bot)
  static async handleFollow(event) {
    const userId = event.source.userId;
    const replyToken = event.replyToken;

    try {
      // Send welcome message
      const welcomeMessage = {
        type: 'text',
        text: `🎉 Welcome to SiamIT Leave Management Bot!

I'm here to help you manage your leave requests and check your status.

Use the menu below to get started!

To link your account for full access, please visit the web application and use LINE Login.`
      };
      
      await client.replyMessage(replyToken, welcomeMessage);
    } catch (error) {
      console.error('Error handling follow event:', error);
    }
  }

  // Get AppDataSource (we'll need to pass this from the main app)
  static getAppDataSource() {
    // This will be set from the main app
    return global.AppDataSource;
  }

  // Process user message and call appropriate API
  static async processUserMessage(message, userId) {
    const command = message.toLowerCase().trim();

    // Simple test command that always works - CHECK THIS FIRST
    if (command.includes('test') || command.includes('ping') || command.includes('hello')) {
      // Test database connection and user lookup
      let dbStatus = 'Unknown';
      let directLookup = 'Unknown';
      let allUsers = 'None';
      let tableInfo = 'Unknown';
      
      try {
        if (global.AppDataSource) {
          dbStatus = 'Connected';
          const userRepo = global.AppDataSource.getRepository('User');
          
          // Method 1: Direct lookup by lineUserId (what bot uses)
          const directUser = await userRepo.findOneBy({ lineUserId: userId });
          directLookup = directUser ? `Found (ID: ${directUser.id}, Name: ${directUser.name})` : 'Not found';
          
          // Method 2: Get all users with lineUserId (like notification system does)
          const allUsersWithLineId = await userRepo.find({ 
            where: { lineUserId: NotNull() },
            select: ['id', 'name', 'lineUserId']
          });
          allUsers = allUsersWithLineId.length > 0 ? 
            allUsersWithLineId.map(u => `ID:${u.id} Name:${u.name} LINE:${u.lineUserId}`).join('\n') : 
            'No users with lineUserId found';
          
          // Method 3: Check table structure
          const tableQuery = `DESCRIBE users`;
          const tableResult = await global.AppDataSource.query(tableQuery);
          const lineUserIdColumn = tableResult.find(col => col.Field === 'lineUserId');
          tableInfo = lineUserIdColumn ? 
            `Column: ${lineUserIdColumn.Field}, Type: ${lineUserIdColumn.Type}, Null: ${lineUserIdColumn.Null}` : 
            'lineUserId column not found';
        } else {
          dbStatus = 'Not connected';
        }
      } catch (error) {
        dbStatus = `Error: ${error.message}`;
      }
      
      return {
        type: 'text',
        text: `🤖 Bot Debug Info\n\nLINE User ID from webhook: "${userId}"\nUser ID type: ${typeof userId}\nUser ID length: ${userId ? userId.length : 0}\nDatabase: ${dbStatus}\nDirect Lookup: ${directLookup}\nTable Info: ${tableInfo}\nAll Users:\n${allUsers}`
      };
    }

    // Commands that don't need user linking
    const publicCommands = ['help', 'announcements', 'request', 'recent announcements', 'leave management web site', 'company holidays', 'annual holidays'];
    
    let user = null;
    if (!publicCommands.includes(command)) {
      // Check if user is linked
      const userRepo = global.AppDataSource.getRepository('User');
      user = await userRepo.findOneBy({ lineUserId: userId });
      
      if (!user) {
        return {
          type: 'text',
          text: `🔗 Please link your LINE account first!\n\nTo link your account, go to the web application and use the LINE Login feature.\n\nCommands that work without linking:\n- help\n- announcements\n- request\n- recent announcements\n- leave management web site\n- company holidays\n- annual holidays`
        };
      }
    }

    // Enhanced command matching with partial matches
    if (command.includes('help') || command === 'help') {
      return this.getHelpMessage();
    }
    
    if (command.includes('status') || command.includes('recent leave') || command.includes('leave status')) {
      return await this.getLeaveStatus(user);
    }
    
    if (command.includes('balance') || command.includes('leave entitlements') || command.includes('entitlements') || command.includes('quota')) {
      return await this.getLeaveBalance(user);
    }
    
    if (command.includes('history') || command.includes('leave history')) {
      return await this.getLeaveHistory(user);
    }
    
    if (command.includes('profile') || command.includes('my profile')) {
      return await this.getUserProfile(user);
    }
    
    if (command.includes('announcements') || command.includes('recent announcements')) {
      return await this.getAnnouncements();
    }
    
    if (command.includes('request') || command.includes('submit request')) {
      return this.getRequestInstructions();
    }
    
    if (command.includes('website') || command.includes('web site') || command.includes('leave management web site')) {
      return this.getLeaveWebsiteMessage();
    }
    
    if (command.includes('company holidays') || command.includes('company holiday')) {
      return await this.getCompanyHolidays();
    }
    
    if (command.includes('annual holidays') || command.includes('annual holiday')) {
      return await this.getAnnualHolidays();
    }

    // Fallback to help message
    return this.getHelpMessage();
  }

  // Get leave status from API and format for LINE
  static async getLeaveStatus(user) {
    try {
      // Get recent leave requests directly from database like /recent-leave-requests endpoint
      const leaveRepo = global.AppDataSource.getRepository('LeaveRequest');
      const leaveTypeRepo = global.AppDataSource.getRepository('LeaveType');
      
      // Find 3 most recent leave requests for the user
      const leaveRequests = await leaveRepo.find({ 
        where: { Repid: user.id }, 
        order: { createdAt: 'DESC' }, 
        take: 3 
      });

      // Helper to calculate duration - using utility function

      // Helper to get status in both languages
      function getStatusDisplay(status) {
        switch (status.toLowerCase()) {
          case 'approved':
            return 'Approved';
          case 'pending':
            return 'Pending';
          case 'rejected':
            return 'Rejected';
          default:
            return status;
        }
      }

      let message = '📋 Recent Leave:\n\n';
      
      if (leaveRequests.length === 0) {
        message += 'No recent leave requests found.';
      } else {
        for (const lr of leaveRequests) {
          // Get leave type names
          let leaveTypeNameTh = lr.leaveType;
          let leaveTypeNameEn = lr.leaveType;
          
          if (lr.leaveType && lr.leaveType.length > 20) {
            // ID-based leave type - Use raw query to include soft-deleted records
            const leaveTypeQuery = `SELECT * FROM leave_type WHERE id = ?`;
            const [leaveTypeResult] = await global.AppDataSource.query(leaveTypeQuery, [lr.leaveType]);
            const leaveType = leaveTypeResult ? leaveTypeResult[0] : null;
            if (leaveType) {
                          if (leaveType.is_active === false) {
              // Add [DELETED] prefix for inactive/deleted leave types
              const prefix_th = '[DELETED] ';
              const prefix_en = '[DELETED] ';
              leaveTypeNameTh = prefix_th + (leaveType.leave_type_th || lr.leaveType);
              leaveTypeNameEn = prefix_en + (leaveType.leave_type_en || lr.leaveType);
            } else {
              leaveTypeNameTh = leaveType.leave_type_th || lr.leaveType;
              leaveTypeNameEn = leaveType.leave_type_en || lr.leaveType;
            }
            }
          } else {
            // String-based leave type
            const leaveType = await leaveTypeRepo.findOne({
              where: [
                { leave_type_th: lr.leaveType },
                { leave_type_en: lr.leaveType }
              ]
            });
            if (leaveType) {
              leaveTypeNameTh = leaveType.leave_type_th;
              leaveTypeNameEn = leaveType.leave_type_en;
            }
          }

          // Calculate duration
          let duration = '';
          if (lr.startTime && lr.endTime) {
            // Hour-based
            const startMinutes = convertToMinutes(...lr.startTime.split(':').map(Number));
            const endMinutes = convertToMinutes(...lr.endTime.split(':').map(Number));
            let durationHours = (endMinutes - startMinutes) / 60;
            if (durationHours < 0 || isNaN(durationHours)) durationHours = 0;
            duration = `${Math.floor(durationHours)} hour`;
          } else if (lr.startDate && lr.endDate) {
            // Day-based
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            let days = calculateDaysBetween(start, end);
            if (days < 0 || isNaN(days)) days = 0;
            duration = `${days} day`;
          }

          // Format status with emoji and bilingual display
          const status = lr.status === 'approved' ? '✅' : 
                        lr.status === 'pending' ? '⏳' : '❌';
          const statusDisplay = getStatusDisplay(lr.status);

          // Format date
          const startDate = new Date(lr.startDate).toLocaleDateString('en-GB');
          const endDate = new Date(lr.endDate).toLocaleDateString('en-GB');

          // Display leave type in both languages
          const leaveTypeDisplay = leaveTypeNameEn && leaveTypeNameEn !== leaveTypeNameTh 
            ? `${leaveTypeNameTh} (${leaveTypeNameEn})`
            : leaveTypeNameTh;

          message += `${status} ${leaveTypeDisplay}\n`;
          message += `   📅 ${startDate} to ${endDate}\n`;
          message += `   ⏱️ Duration: ${duration}\n`;
          message += `   📝 Status: ${statusDisplay}\n\n`;
        }
      }
      
      return { type: 'text', text: message };
    } catch (error) {
      console.error('Error fetching recent leave:', error);
      console.error('Error details:', error.message, error.stack);
      return { type: 'text', text: '❌ Error fetching recent leave.' };
    }
  }

  // Get leave balance from API and format for LINE
  static async getLeaveBalance(user) {
    try {
      // ใช้ getLeaveUsageSummary แทนการคำนวณแบบ manual
      const currentYear = new Date().getFullYear();
      const remainingLeaveData = await getLeaveUsageSummary(user.id, currentYear, global.AppDataSource);

      // Helper: Format duration display
      function formatDuration(day, hour) {
        if (day > 0 && hour > 0) {
          return `${day} days ${hour} hours`;
        } else if (day > 0) {
          return `${day} days`;
        } else if (hour > 0) {
          return `${hour} hours`;
        } else {
          return '0 days';
        }
      }

      // Helper: Convert total hours to days and remaining hours (fallback implementation)
      function toDayHourFallback(val) {
        const day = Math.floor(val);
        const hour = Math.round((val - day) * 9); // Assuming 9 working hours per day
        return { day, hour };
      }

      let message = '💰 Leave Entitlements:\n\n';
      
      // Display for each leave type
      for (const leaveData of remainingLeaveData) {
        // Convert to day/hour format for display
        let quotaObj, usedObj, remainingObj;
        
        try {
          quotaObj = toDayHour(leaveData.quota_days);
          usedObj = toDayHour(leaveData.total_used_days);
          remainingObj = toDayHour(leaveData.remaining_days);
        } catch (utilError) {
          console.log('Using fallback toDayHour implementation');
          quotaObj = toDayHourFallback(leaveData.quota_days);
          usedObj = toDayHourFallback(leaveData.total_used_days);
          remainingObj = toDayHourFallback(leaveData.remaining_days);
        }

        // Display leave type in both languages
        const leaveTypeDisplay = leaveData.leave_type_name_en && leaveData.leave_type_name_en !== leaveData.leave_type_name_th 
          ? `${leaveData.leave_type_name_th} (${leaveData.leave_type_name_en})`
          : leaveData.leave_type_name_th;

        message += `${leaveTypeDisplay}:\n`;
        message += `   📊 Total: ${formatDuration(quotaObj.day, quotaObj.hour)}\n`;
        message += `   📤 Used: ${formatDuration(usedObj.day, usedObj.hour)}\n`;
        message += `   ✅ Remaining: ${formatDuration(remainingObj.day, remainingObj.hour)}\n\n`;
      }
      
      return { type: 'text', text: message };
    } catch (error) {
      console.error('Error fetching leave entitlements:', error);
      console.error('Error details:', error.message, error.stack);
      return { type: 'text', text: '❌ Error fetching leave entitlements.' };
    }
  }

  // Get leave history from API and format for LINE
  static async getLeaveHistory(user) {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/api/leave-history/${user.id}`);
      
      if (response.data.success) {
        const leaves = response.data.data;
        
        let message = '📚 Your Leave History:\n\n';
        
        if (leaves.length === 0) {
          message += 'No leave history found.';
        } else {
          leaves.slice(0, 3).forEach(leave => {
            const status = leave.status === 'approved' ? '✅' : 
                          leave.status === 'pending' ? '⏳' : '❌';
            message += `${status} ${leave.leaveType.name}\n`;
            message += `   📅 ${leave.startDate} to ${leave.endDate}\n`;
            message += `   📝 Reason: ${leave.reason}\n`;
            message += `   👤 Status: ${leave.status.toUpperCase()}\n\n`;
          });
        }
        
        return { type: 'text', text: message };
      } else {
        return { type: 'text', text: '❌ Unable to fetch leave history.' };
      }
    } catch (error) {
      console.error('API call error:', error);
      return { type: 'text', text: '❌ Error fetching leave history.' };
    }
  }

  // Get user profile from API and format for LINE
  static async getUserProfile(user) {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/api/profile/${user.id}`);
      
      if (response.data.success) {
        const profile = response.data.data;
        
        let message = '👤 Your Profile:\n\n';
        message += `📛 Name: ${profile.name}\n`;
        message += `🏢 Department: ${profile.department.name}\n`;
        message += `💼 Position: ${profile.position.name}\n`;
        message += `📧 Email: ${profile.email}\n`;
        message += `📱 Phone: ${profile.phone}\n`;
        
        return { type: 'text', text: message };
      } else {
        return { type: 'text', text: '❌ Unable to fetch profile.' };
      }
    } catch (error) {
      console.error('API call error:', error);
      return { type: 'text', text: '❌ Error fetching profile.' };
    }
  }

  // Get announcements from API and format for LINE
  static async getAnnouncements() {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/api/announcements`);
      
      console.log('Announcements API response:', response.data);
      
      if (response.data.status === 'success' || response.data.success) {
        const announcements = response.data.data;
        
        let message = '📢 Recent Announcements:\n\n';
        
        if (!announcements || announcements.length === 0) {
          message += 'No announcements at the moment.';
        } else {
          announcements.slice(0, 3).reverse().forEach(announcement => {
            message += `📢 ${announcement.subject}\n`;
            if (announcement.createdAt) {
              // Format date to show only YYYY-MM-DD
              const date = new Date(announcement.createdAt);
              const formattedDate = date.toISOString().split('T')[0];
              message += `   📅 ${formattedDate}\n`;
            }
            if (announcement.detail) {
              message += `   📝 ${announcement.detail.substring(0, 100)}...\n`;
            }
            message += '\n';
          });
        }
        
        return { type: 'text', text: message };
      } else {
        return { type: 'text', text: '❌ Unable to fetch recent announcements.' };
      }
    } catch (error) {
      console.error('API call error:', error);
      return { type: 'text', text: '❌ Error fetching recent announcements.' };
    }
  }

  // Static help message
  static getHelpMessage() {
    return {
      type: 'text',
      text: `🤖 SiamIT Leave Management Bot

Available Commands:

📢 announcements - Latest announcements (no login needed)
📝 request - How to submit leave request (no login needed)
❓ help - Show this message (no login needed)

🔗 Commands that need account linking:
📋 status - Check your leave status
💰 balance - Check your leave balance  
📚 history - View your leave history
👤 profile - View your profile

To link your account, go to the web application and use LINE Login!`
    };
  }

  // Instructions for submitting leave request
  static getRequestInstructions() {
    return {
      type: 'text',
      text: `📝 To submit a leave request:

1. 🌐 Go to the web application
2. 📋 Navigate to Leave Request page
3. ✏️ Fill in the required details
4. 📤 Submit your request

You'll receive LINE notifications when your request is approved/rejected!`
    };
  }

  // Send notification to specific user (for other parts of your app to use)
  static async sendNotification(userId, message) {
    try {
      console.log('=== LINE Notification Debug ===');
      console.log('Attempting to send LINE notification to:', userId);
      console.log('User ID type:', typeof userId);
      console.log('User ID length:', userId ? userId.length : 0);
      console.log('Message preview:', message.substring(0, 100) + '...');
      console.log('LINE Bot config check:');
      console.log('- Channel Access Token exists:', !!process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN);
      console.log('- Channel Secret exists:', !!process.env.LINE_BOT_CHANNEL_SECRET);
      console.log('==============================');
      
      await client.pushMessage(userId, {
        type: 'text',
        text: message
      });
      
      console.log('LINE notification sent successfully');
      return { success: true };
    } catch (error) {
      console.error('=== LINE Notification Error ===');
      console.error('Error sending LINE notification:', error);
      console.error('Error details:', {
        userId: userId,
        userIdType: typeof userId,
        messageLength: message.length,
        errorCode: error.statusCode,
        errorMessage: error.message,
        errorStack: error.stack
      });
      
      // Check if it's a permission issue
      if (error.statusCode === 403) {
        return { 
          success: false, 
          error: 'User has not added the bot as a friend or blocked the bot',
          details: error.message 
        };
      }
      
      // Check if it's a user not found issue
      if (error.statusCode === 400) {
        return { 
          success: false, 
          error: 'Invalid user ID or user not found',
          details: error.message 
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  // Helper method to get user by LINE ID
  static async getUserByLineId(lineUserId) {
    try {
      const userRepo = global.AppDataSource.getRepository('User');
      return await userRepo.findOneBy({ lineUserId: lineUserId });
    } catch (error) {
      console.error('Error getting user by LINE ID:', error);
      return null;
    }
  }

  // Test method to verify LINE Bot functionality
  static async testLineBotMethods(req, res) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID is required' 
        });
      }

      // Get user from database
      const userRepo = global.AppDataSource.getRepository('User');
      const user = await userRepo.findOneBy({ id: userId });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      // Test getLeaveStatus
      const statusResult = await LineController.getLeaveStatus(user);
      
      // Test getLeaveBalance
      const balanceResult = await LineController.getLeaveBalance(user);

      res.json({
        success: true,
        results: {
          leaveStatus: statusResult,
          leaveBalance: balanceResult
        }
      });

    } catch (error) {
      console.error('Error testing LINE Bot methods:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Debug method to check LINE user linking
  static async debugLineUser(req, res) {
    try {
      const { lineUserId } = req.body;
      
      if (!lineUserId) {
        return res.status(400).json({ 
          success: false, 
          error: 'LINE User ID is required' 
        });
      }

      // Get user from database
      const userRepo = global.AppDataSource.getRepository('User');
      const user = await userRepo.findOneBy({ lineUserId: lineUserId });
      
      if (!user) {
        return res.json({
          success: true,
          linked: false,
          message: 'User not found in database with this LINE User ID',
          lineUserId: lineUserId
        });
      }

      res.json({
        success: true,
        linked: true,
        user: {
          id: user.id,
          name: user.Name,
          email: user.Email,
          lineUserId: user.lineUserId
        }
      });

    } catch (error) {
      console.error('Error debugging LINE user:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Test LINE Bot configuration
  static async testBotConfig(req, res) {
    try {
      const config = {
        channelAccessToken: process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN ? 'Set' : 'Not set',
        channelSecret: process.env.LINE_BOT_CHANNEL_SECRET ? 'Set' : 'Not set',
        channelId: process.env.LINE_CHANNEL_ID ? 'Set' : 'Not set',
        redirectUri: process.env.LINE_REDIRECT_URI || 'Not set'
      };

      // Test LINE Bot client
      let clientTest = 'Failed';
      try {
        const testClient = new line.Client({
          channelAccessToken: process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN,
          channelSecret: process.env.LINE_BOT_CHANNEL_SECRET
        });
        clientTest = 'Success';
      } catch (clientError) {
        clientTest = `Failed: ${clientError.message}`;
      }

      res.json({
        success: true,
        config: config,
        clientTest: clientTest,
        database: global.AppDataSource ? 'Connected' : 'Not connected'
      });

    } catch (error) {
      console.error('Error testing bot config:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Functions for your Rich Menu buttons
  static getLeaveWebsiteMessage() {
    return {
      type: 'text',
      text: `🌐 SiamIT Leave Management Website

To access the full leave management system:

📱 Web App: [Your Web App URL]
💻 Desktop: [Your Web App URL]

Features available on the website:
• Submit leave requests
• Upload documents
• View detailed history
• Manage profile settings
• Advanced reporting

You'll receive LINE notifications for approvals and updates!`
    };
  }

  static async getCompanyHolidays() {
    try {
      // Get company holidays directly from database like /api/custom-holidays endpoint
      const customHolidayRepo = global.AppDataSource.getRepository('CustomHoliday');
      
      // Get current year and month
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth(); // 0-11
      
      // Get holidays for current month only
      const holidays = await customHolidayRepo.find({
        where: {
          date: Between(
            new Date(currentYear, currentMonth, 1), // Start of current month
            new Date(currentYear, currentMonth + 1, 0) // End of current month
          )
        },
        order: {
          date: 'ASC'
        }
      });

      let message = '🏢 Company Holidays (Current Month):\n\n';
      
      if (!holidays || holidays.length === 0) {
        message += 'No company holidays scheduled for this month.';
      } else {
        holidays.forEach(holiday => {
          // Format date
          const date = new Date(holiday.date);
          const formattedDate = date.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // Display title in both languages if available
          let titleDisplay = holiday.title;
          if (holiday.title && holiday.title.includes('(') && holiday.title.includes(')')) {
            // Already in bilingual format
            titleDisplay = holiday.title;
          } else {
            // Try to make it bilingual (you can customize this based on your data)
            titleDisplay = holiday.title;
          }

          message += `📅 ${formattedDate}\n`;
          message += `   🏷️ ${titleDisplay}\n`;
          if (holiday.description) {
            message += `   📝 ${holiday.description}\n`;
          }
          message += '\n';
        });
      }
      
      return { type: 'text', text: message };
    } catch (error) {
      console.error('Error fetching company holidays:', error);
      return { type: 'text', text: '❌ Error fetching company holidays.' };
    }
  }

  static async getAnnualHolidays() {
    try {
      // Get current year and month
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth(); // 0-11
      
      // Thai holidays for current month (similar to getThaiHolidaysByMonth)
      const holidays = this.getThaiHolidaysForMonth(currentYear, currentMonth);
      
      let message = '📅 Annual Holidays (Current Month):\n\n';
      
      if (!holidays || holidays.length === 0) {
        message += 'No annual holidays scheduled for this month.';
      } else {
        holidays.forEach(holiday => {
          // Format date
          const date = new Date(holiday.date);
          const formattedDate = date.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // Display name in both languages
          const nameDisplay = holiday.name;

          message += `📅 ${formattedDate}\n`;
          message += `   🏷️ ${nameDisplay}\n\n`;
        });
      }
      
      return { type: 'text', text: message };
    } catch (error) {
      console.error('Error getting annual holidays:', error);
      return { type: 'text', text: '❌ Error fetching annual holidays.' };
    }
  }

  // Helper function to get Thai holidays for a specific month
  static getThaiHolidaysForMonth(year, month) {
    const holidays = [];
    
    // Define Thai holidays with bilingual names
    const thaiHolidays = [
      { date: `${year}-01-01`, name: 'วันขึ้นปีใหม่ (New Year\'s Day)' },
      { date: `${year}-01-02`, name: 'วันหยุดชดเชยวันขึ้นปีใหม่ (New Year\'s Day Holiday)' },
      { date: `${year}-02-14`, name: 'วันวาเลนไทน์ (Valentine\'s Day)' },
      { date: `${year}-04-06`, name: 'วันจักรี (Chakri Memorial Day)' },
      { date: `${year}-04-13`, name: 'วันสงกรานต์ (Songkran Festival)' },
      { date: `${year}-04-14`, name: 'วันสงกรานต์ (Songkran Festival)' },
      { date: `${year}-04-15`, name: 'วันสงกรานต์ (Songkran Festival)' },
      { date: `${year}-04-16`, name: 'วันสงกรานต์ (Songkran Festival)' },
      { date: `${year}-05-01`, name: 'วันแรงงานแห่งชาติ (Labour Day)' },
      { date: `${year}-05-05`, name: 'วันฉัตรมงคล (Coronation Day)' },
      { date: `${year}-06-03`, name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดา พัชรสุธาพิมลลักษณ พระบรมราชินี (Queen Suthida\'s Birthday)' },
      { date: `${year}-07-28`, name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (King\'s Birthday)' },
      { date: `${year}-08-12`, name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสิริกิติ์ พระบรมราชินีนาถ พระบรมราชชนนีพันปีหลวง (The Queen Mother\'s Birthday)' },
      { date: `${year}-10-13`, name: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช บรมนาถบพิตร (King Bhumibol Adulyadej Memorial Day)' },
      { date: `${year}-10-23`, name: 'วันปิยมหาราช (King Chulalongkorn Day)' },
      { date: `${year}-12-05`, name: 'วันคล้ายวันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช บรมนาถบพิตร (King Bhumibol Adulyadej\'s Birthday)' },
      { date: `${year}-12-10`, name: 'วันรัฐธรรมนูญ (Constitution Day)' },
      { date: `${year}-12-25`, name: 'วันคริสต์มาส (Christmas Day)' },
      { date: `${year}-12-31`, name: 'วันสิ้นปี (New Year\'s Eve)' }
    ];
    
    // Filter holidays for the specified month
    return thaiHolidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.getMonth() === month;
    });
  }
}

module.exports = LineController; 
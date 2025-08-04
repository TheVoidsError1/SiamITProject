const line = require('@line/bot-sdk');
const axios = require('axios');
const LineLinkingController = require('./LineLinkingController');

// LINE Bot configuration using environment variables
const config = {
  channelAccessToken: process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_BOT_CHANNEL_SECRET
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
    if (event.type !== 'message' || event.message.type !== 'text') {
      return Promise.resolve(null);
    }

    const text = event.message.text;
    const userId = event.source.userId;
    const replyToken = event.replyToken;

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

  // Get AppDataSource (we'll need to pass this from the main app)
  static getAppDataSource() {
    // This will be set from the main app
    return global.AppDataSource;
  }

  // Process user message and call appropriate API
  static async processUserMessage(message, userId) {
    const command = message.toLowerCase().trim();

    // Commands that don't need user linking
    const publicCommands = ['help', 'announcements', 'request'];
    
    if (!publicCommands.includes(command)) {
      // Check if user is linked
      const user = await LineLinkingController.getUserByLineId(global.AppDataSource, userId);
      
      if (!user) {
        return {
          type: 'text',
          text: `🔗 Please link your LINE account first!\n\nTo link your account, go to the web application and use the LINE Login feature.\n\nCommands that work without linking:\n- help\n- announcements\n- request`
        };
      }
    }

    switch (command) {
      case 'help':
        return this.getHelpMessage();

      case 'status':
        return await this.getLeaveStatus(userId);

      case 'balance':
        return await this.getLeaveBalance(userId);

      case 'history':
        return await this.getLeaveHistory(userId);

      case 'profile':
        return await this.getUserProfile(userId);

      case 'announcements':
        return await this.getAnnouncements();

      case 'request':
        return this.getRequestInstructions();

      default:
        return this.getHelpMessage();
    }
  }

  // Get leave status from API and format for LINE
  static async getLeaveStatus(userId) {
    try {
      const response = await axios.get(`http://localhost:3001/api/leave-history/${userId}`);
      
      if (response.data.success) {
        const leaves = response.data.data;
        
        let message = '📋 Your Leave Status:\n\n';
        
        if (leaves.length === 0) {
          message += 'No leave requests found.';
        } else {
          leaves.slice(0, 5).forEach(leave => {
            const status = leave.status === 'approved' ? '✅' : 
                          leave.status === 'pending' ? '⏳' : '❌';
            message += `${status} ${leave.leaveType.name}\n`;
            message += `   📅 ${leave.startDate} to ${leave.endDate}\n`;
            message += `   📝 Status: ${leave.status.toUpperCase()}\n\n`;
          });
        }
        
        return { type: 'text', text: message };
      } else {
        return { type: 'text', text: '❌ Unable to fetch leave status.' };
      }
    } catch (error) {
      console.error('API call error:', error);
      return { type: 'text', text: '❌ Error fetching leave status.' };
    }
  }

  // Get leave balance from API and format for LINE
  static async getLeaveBalance(userId) {
    try {
      const response = await axios.get(`http://localhost:3001/api/leave-quota/${userId}`);
      
      if (response.data.success) {
        const quotas = response.data.data;
        
        let message = '💰 Your Leave Balance:\n\n';
        
        quotas.forEach(quota => {
          message += `${quota.leaveType.name}:\n`;
          message += `   📊 Used: ${quota.usedDays} days\n`;
          message += `   ✅ Remaining: ${quota.remainingDays} days\n`;
          message += `   📋 Total: ${quota.totalDays} days\n\n`;
        });
        
        return { type: 'text', text: message };
      } else {
        return { type: 'text', text: '❌ Unable to fetch leave balance.' };
      }
    } catch (error) {
      console.error('API call error:', error);
      return { type: 'text', text: '❌ Error fetching leave balance.' };
    }
  }

  // Get leave history from API and format for LINE
  static async getLeaveHistory(userId) {
    try {
      const response = await axios.get(`http://localhost:3001/api/leave-history/${userId}`);
      
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
  static async getUserProfile(userId) {
    try {
      const response = await axios.get(`http://localhost:3001/api/profile/${userId}`);
      
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
      const response = await axios.get('http://localhost:3001/api/announcements');
      
      console.log('Announcements API response:', response.data);
      
      if (response.data.status === 'success' || response.data.success) {
        const announcements = response.data.data;
        
        let message = '📢 Latest Announcements:\n\n';
        
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
        return { type: 'text', text: '❌ Unable to fetch announcements.' };
      }
    } catch (error) {
      console.error('API call error:', error);
      return { type: 'text', text: '❌ Error fetching announcements.' };
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
      await client.pushMessage(userId, {
        type: 'text',
        text: message
      });
      return { success: true };
    } catch (error) {
      console.error('Error sending LINE notification:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = LineController; 
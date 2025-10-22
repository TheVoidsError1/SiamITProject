const bcrypt = require('bcryptjs');
const axios = require('axios');

class LineLoginController {

  // Validate LINE environment variables
  static validateLineConfig() {
    const requiredVars = [
      'LINE_CHANNEL_ID',
      'LINE_CHANNEL_SECRET', 
      'LINE_REDIRECT_URI'
    ];
    
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required LINE environment variables: ${missing.join(', ')}`
      };
    }
    
    return { valid: true };
  }

  // Get LINE Login URL for authenticated user
  static async getLoginUrl(req, res) {
    try {
      // Validate LINE configuration first
      const configValidation = LineLoginController.validateLineConfig();
      if (!configValidation.valid) {
        return res.status(500).json({ 
          success: false, 
          error: configValidation.error 
        });
      }

      // Check if user is authenticated (you'll need to implement this based on your auth system)
      const userId = req.user?.userId; // Using userId from JWT token
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'User must be logged in first' 
        });
      }

      // Generate state parameter to link with user
      const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
      
             // Create LINE Login URL
      console.log('LINE Login Debug:');
      console.log('Channel ID:', process.env.LINE_CHANNEL_ID);
      console.log('Redirect URI:', process.env.LINE_REDIRECT_URI);
      
       const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
         `response_type=code&` +
         `client_id=${process.env.LINE_CHANNEL_ID}&` +
         `redirect_uri=${encodeURIComponent(process.env.LINE_REDIRECT_URI)}&` +
         `state=${state}&` +
         `scope=profile%20openid`;
      
      console.log('Generated Login URL:', loginUrl);

      res.json({
        success: true,
        loginUrl: loginUrl,
        message: 'LINE Login URL generated successfully'
      });

    } catch (error) {
      console.error('Error generating LINE login URL:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Handle LINE Login callback
  static async handleCallback(req, res) {
    try {
      // Validate LINE configuration first
      const configValidation = LineLoginController.validateLineConfig();
      if (!configValidation.valid) {
        console.error('LINE configuration invalid:', configValidation.error);
        return res.status(500).json({ 
          success: false, 
          error: configValidation.error 
        });
      }

      console.log('LINE Callback Debug:');
      console.log('- Query params:', req.query);
      console.log('- Full URL:', req.url);
      
      const { code, state } = req.query;
      
      if (!code || !state) {
        console.error('Missing parameters - Code:', !!code, 'State:', !!state);
        return res.status(400).json({ 
          success: false, 
          error: 'Missing code or state parameter' 
        });
      }

      // Decode state to get user ID
      let stateData;
      try {
        stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        console.log('Decoded state:', stateData);
      } catch (stateError) {
        console.error('Error decoding state:', stateError);
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid state parameter format' 
        });
      }
      
      const userId = stateData.userId;

      if (!userId) {
        console.error('No userId in state:', stateData);
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid state parameter - no userId' 
        });
      }

      console.log('Processing callback for user:', userId);

      // Check if code looks valid (basic validation)
      if (code.length < 10) {
        console.error('Invalid authorization code format:', code);
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid authorization code format' 
        });
      }

      // Exchange code for access token
      const tokenResponse = await LineLoginController.exchangeCodeForToken(code);
      
      if (!tokenResponse.success) {
        console.error('Token exchange failed:', tokenResponse);
        return res.status(400).json(tokenResponse);
      }

      // Get LINE user profile
      console.log('Getting LINE profile with token:', tokenResponse.accessToken ? 'Present' : 'Missing');
      const profileResponse = await LineLoginController.getLineProfile(tokenResponse.accessToken);
      
      if (!profileResponse.success) {
        console.error('Profile retrieval failed:', profileResponse);
        return res.status(400).json(profileResponse);
      }
      
      console.log('Profile retrieved successfully:', profileResponse.userId);

      // Link LINE user to database user
      const linkResult = await LineLoginController.linkLineUser(userId, profileResponse.userId, profileResponse.displayName);

      if (linkResult.success) {
        // Return HTML response directly with success data
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LINE Linking</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <p>Processing LINE linking...</p>
    </div>

    <script>
        // Send success message to parent window
        if (window.opener) {
            window.opener.postMessage({
                type: 'LINE_LINK_SUCCESS',
                lineUserId: '${profileResponse.userId}',
                displayName: '${profileResponse.displayName}',
                pictureUrl: '${profileResponse.pictureUrl}'
            }, '*');
        }
        
        // Close the popup after a short delay
        setTimeout(() => {
            window.close();
        }, 1000);
    </script>
</body>
</html>`;
        
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        // Return HTML response directly with error data
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LINE Linking</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .error {
            color: #e74c3c;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error">❌ Error</div>
        <p>${linkResult.error || 'Failed to link LINE account'}</p>
    </div>

    <script>
        // Send error message to parent window
        if (window.opener) {
            window.opener.postMessage({
                type: 'LINE_LINK_ERROR',
                message: '${linkResult.error || 'Failed to link LINE account'}'
            }, '*');
        }
        
        // Close the popup after a short delay
        setTimeout(() => {
            window.close();
        }, 2000);
    </script>
</body>
</html>`;
        
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      }

    } catch (error) {
      console.error('Error handling LINE callback:', error);
      console.error('Error stack:', error.stack);
      
      // Return HTML error page instead of JSON for better user experience
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LINE Linking Error</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .error {
            color: #e74c3c;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error">❌ Error</div>
        <p>Failed to process LINE linking: ${error.message}</p>
        <p><small>Please try again or contact support.</small></p>
    </div>

    <script>
        // Send error message to parent window
        if (window.opener) {
            window.opener.postMessage({
                type: 'LINE_LINK_ERROR',
                message: '${error.message}'
            }, '*');
        }
        
        // Close the popup after a short delay
        setTimeout(() => {
            window.close();
        }, 3000);
    </script>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.status(500).send(html);
    }
  }

  // Exchange authorization code for access token
  static async exchangeCodeForToken(code) {
    try {
      console.log('LINE Token Exchange Debug:');
      console.log('- Code:', code);
      console.log('- Redirect URI:', process.env.LINE_REDIRECT_URI);
      console.log('- Channel ID:', process.env.LINE_CHANNEL_ID);
      console.log('- Channel Secret exists:', !!process.env.LINE_CHANNEL_SECRET);

      const tokenData = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.LINE_REDIRECT_URI,
        client_id: process.env.LINE_CHANNEL_ID,
        client_secret: process.env.LINE_CHANNEL_SECRET,
      });

      console.log('Token request data:', tokenData.toString());

      const response = await axios.post('https://api.line.me/oauth2/v2.1/token', 
        tokenData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      console.log('Token response status:', response.status);
      console.log('Token response data:', response.data);

      const data = response.data;

      if (data.access_token) {
        return {
          success: true,
          accessToken: data.access_token,
          idToken: data.id_token
        };
      } else {
        return {
          success: false,
          error: 'Failed to get access token',
          details: data
        };
      }

    } catch (error) {
      console.error('Error exchanging code for token:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Handle specific LINE API errors
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          error: errorData.error_description || errorData.error || error.message,
          details: errorData
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get LINE user profile
  static async getLineProfile(accessToken) {
    try {
      console.log('Getting LINE profile with token length:', accessToken ? accessToken.length : 0);
      
      const response = await axios.get('https://api.line.me/v2/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('Profile response status:', response.status);
      console.log('Profile response data:', response.data);

      const data = response.data;

      if (data.userId) {
        return {
          success: true,
          userId: data.userId,
          displayName: data.displayName,
          pictureUrl: data.pictureUrl,
          statusMessage: data.statusMessage
        };
      } else {
        return {
          success: false,
          error: 'Failed to get user profile - no userId in response',
          details: data
        };
      }

    } catch (error) {
      console.error('Error getting LINE profile:', error);
      console.error('Profile error response:', error.response?.data);
      console.error('Profile error status:', error.response?.status);
      
      // Handle specific LINE API errors
      if (error.response?.data) {
        const errorData = error.response.data;
        return {
          success: false,
          error: errorData.error_description || errorData.error || error.message,
          details: errorData
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Link LINE user to database user
  static async linkLineUser(databaseUserId, lineUserId, displayName) {
    try {
      // Get AppDataSource (you'll need to pass this or make it global)
      const AppDataSource = global.AppDataSource;
      
      if (!AppDataSource) {
        return {
          success: false,
          error: 'Database connection not available'
        };
      }

      const userRepo = AppDataSource.getRepository('User');
      
      // Find the user in unified users table using id
      const user = await userRepo.findOneBy({ id: databaseUserId });
      
      if (!user) {
        return {
          success: false,
          error: 'User not found in database'
        };
      }

      // Check if LINE user ID is already linked to another user
      const existingLink = await userRepo.findOneBy({ lineUserId });
      if (existingLink && existingLink.id !== databaseUserId) {
        return {
          success: false,
          error: 'This LINE account is already linked to another user'
        };
      }

      // Link the LINE user ID
      user.lineUserId = lineUserId;
      await userRepo.save(user);

      // Auto-add LINE OA as friend
      await LineLoginController.sendFriendInvitation(lineUserId, displayName);

      return {
        success: true,
        message: 'LINE account linked successfully',
        user: {
          id: user.id,
          email: user.Email,
          lineUserId: lineUserId,
          displayName: displayName
        }
      };

    } catch (error) {
      console.error('Error linking LINE user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if user is linked
  static async checkLinkStatus(req, res) {
    try {
      const userId = req.user?.userId; // This is the user ID from unified users table
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'User must be logged in first' 
        });
      }

      const AppDataSource = global.AppDataSource;
      const userRepo = AppDataSource.getRepository('User');
      
      // Find the user entry using id
      const user = await userRepo.findOneBy({ id: userId });
      
      if (user && user.lineUserId) {
        res.json({
          success: true,
          linked: true,
          lineUserId: user.lineUserId
        });
      } else {
        res.json({
          success: true,
          linked: false
        });
      }

    } catch (error) {
      console.error('Error checking link status:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Debug endpoint to test LINE configuration
  static async debugConfig(req, res) {
    try {
      const configValidation = LineLoginController.validateLineConfig();
      
      res.json({
        success: true,
        config: {
          channelId: process.env.LINE_CHANNEL_ID ? 'Set' : 'Not set',
          channelSecret: process.env.LINE_CHANNEL_SECRET ? 'Set' : 'Not set',
          redirectUri: process.env.LINE_REDIRECT_URI || 'Not set',
          validation: configValidation
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Send friend invitation to LINE OA
  static async sendFriendInvitation(lineUserId, displayName) {
    try {
      // Check if LINE Bot configuration is available
      if (!process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN) {
        console.log('LINE Bot not configured - skipping friend invitation');
        return { success: true, message: 'LINE Bot not configured' };
      }

      const line = require('@line/bot-sdk');
      const client = new line.Client({
        channelAccessToken: process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN
      });

      // Create a welcome message with friend invitation
      const welcomeMessage = {
        type: 'text',
        text: `🎉 Welcome ${displayName}!\n\nYour LINE account has been successfully linked to SiamIT Leave Management System.\n\nI'm your Leave Management Bot! I can help you with:\n\n📋 Check your leave status\n💰 View leave balance\n📚 See leave history\n📢 Get announcements\n\nType "help" to see all available commands!\n\nYou'll receive notifications for leave approvals and updates.`
      };

      // Send the welcome message (this will automatically add the bot as a friend)
      await client.pushMessage(lineUserId, welcomeMessage);

      console.log(`Friend invitation sent to LINE user: ${lineUserId}`);
      return { success: true, message: 'Friend invitation sent successfully' };

    } catch (error) {
      console.error('Error sending friend invitation:', error);
      
      // Handle specific LINE API errors
      if (error.statusCode === 403) {
        console.log('User has not added the bot as a friend or blocked the bot');
        return { 
          success: false, 
          error: 'User needs to add the bot as a friend first',
          message: 'Please add the LINE bot as a friend to receive notifications'
        };
      }
      
      if (error.statusCode === 400) {
        console.log('Invalid user ID or user not found');
        return { 
          success: false, 
          error: 'Invalid LINE user ID',
          message: 'LINE user ID is invalid'
        };
      }
      
      // Don't fail the linking process if friend invitation fails
      return { 
        success: false, 
        error: error.message,
        message: 'Friend invitation failed but account linking succeeded'
      };
    }
  }

  // Manually send friend invitation (for users who missed the automatic one)
  static async sendManualFriendInvitation(req, res) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'User must be logged in first' 
        });
      }

      const AppDataSource = global.AppDataSource;
      const userRepo = AppDataSource.getRepository('User');
      
      // Find the user entry using id
      const user = await userRepo.findOneBy({ id: userId });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      if (!user.lineUserId) {
        return res.status(400).json({ 
          success: false, 
          error: 'No LINE account linked' 
        });
      }

      // Send friend invitation
      const result = await LineLoginController.sendFriendInvitation(user.lineUserId, user.Name || 'User');

      if (result.success) {
        res.json({
          success: true,
          message: 'Friend invitation sent successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error sending manual friend invitation:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Unlink LINE account
  static async unlinkAccount(req, res) {
    try {
      const userId = req.user?.userId; // This is the user ID from unified users table
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'User must be logged in first' 
        });
      }

      const AppDataSource = global.AppDataSource;
      const userRepo = AppDataSource.getRepository('User');
      
      // Find the user entry using id
      const user = await userRepo.findOneBy({ id: userId });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      if (!user.lineUserId) {
        return res.status(400).json({ 
          success: false, 
          error: 'No LINE account linked' 
        });
      }

      // Unlink the LINE account
      user.lineUserId = null;
      await userRepo.save(user);

      res.json({
        success: true,
        message: 'LINE account unlinked successfully'
      });

    } catch (error) {
      console.error('Error unlinking account:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = LineLoginController; 
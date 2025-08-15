import { socketService } from './socketService.js';
import { emailService } from './emailService.js';
import { smsService } from './smsService.js';
import { sendPushNotification } from '../routes/push.js';
import User from '../models/User.js';

class NotificationService {
  constructor() {
    this.methods = {
      websocket: true,
      email: false,
      sms: false,
      push: false
    };
  }

  async sendWaterReminder(userId, reminderData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found for notification:', userId);
        return false;
      }

      const results = {
        websocket: false,
        email: false,
        sms: false,
        push: false,
        console: true
      };

      // Console log (always enabled)
      console.log(`🚰 Water Reminder for user ${userId}: Time to drink water! (Reminder #${reminderData.reminderCount} today)`);

      // WebSocket notification (real-time)
      if (this.methods.websocket) {
        results.websocket = socketService.sendWaterReminder(userId, reminderData);
      }

      // Push notification
      if (this.methods.push) {
        try {
          const pushPayload = {
            title: '💧 Time to Drink Water!',
            body: `Stay hydrated! This is your reminder #${reminderData.reminderCount} today.`,
            icon: '/favicon.ico',
            tag: 'water-reminder',
            data: reminderData
          };
          results.push = await sendPushNotification(userId, pushPayload);
        } catch (error) {
          console.error('Push notification failed:', error.message);
        }
      }

      // Email notification
      if (this.methods.email && user.email) {
        try {
          await emailService.sendWaterReminder(
            user.email, 
            user.username || 'User', 
            reminderData.reminderCount
          );
          results.email = true;
        } catch (error) {
          console.error('Email notification failed:', error.message);
        }
      }

      // SMS notification
      if (this.methods.sms && user.phone && smsService.isConfigured()) {
        try {
          await smsService.sendWaterReminder(
            user.phone, 
            user.username || 'User', 
            reminderData.reminderCount
          );
          results.sms = true;
        } catch (error) {
          console.error('SMS notification failed:', error.message);
        }
      }

      console.log('Notification results:', results);
      return results;

    } catch (error) {
      console.error('Notification service error:', error);
      return false;
    }
  }

  // Enable/disable notification methods
  setMethod(method, enabled) {
    if (this.methods.hasOwnProperty(method)) {
      this.methods[method] = enabled;
      console.log(`Notification method ${method} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  // Get current notification methods status
  getMethods() {
    return { ...this.methods };
  }

  // Test all notification methods
  async testNotifications(userId) {
    const testData = {
      reminderCount: 999,
      message: 'Test notification from Cherry'
    };

    return await this.sendWaterReminder(userId, testData);
  }
}

export const notificationService = new NotificationService();

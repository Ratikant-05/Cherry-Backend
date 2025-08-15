import twilio from 'twilio';

class SMSService {
  constructor() {
    this.client = null;
    this.initialize();
  }

  initialize() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  async sendWaterReminder(phoneNumber, userName, reminderCount) {
    if (!this.client) {
      throw new Error('Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }

    try {
      const message = await this.client.messages.create({
        body: `💧 Hi ${userName}! Time to drink water! This is reminder #${reminderCount} today. Stay hydrated! - Cherry App`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log(`Water reminder SMS sent to ${phoneNumber}:`, message.sid);
      return message;
    } catch (error) {
      console.error('SMS sending error:', error);
      throw error;
    }
  }

  isConfigured() {
    return !!this.client;
  }
}

export const smsService = new SMSService();

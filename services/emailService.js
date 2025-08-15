import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transport = null;
    this.initialize();
  }

  initialize() {
    // Only initialize if email credentials are provided
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email service not configured - EMAIL_USER and EMAIL_PASS not set');
      return;
    }

    try {
      // Configure email transport (using Gmail as example)
      this.transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER, // Your email
          pass: process.env.EMAIL_PASS  // App password
        }
      });
    } catch (error) {
      console.error('Email service initialization failed:', error);
    }

    // Alternative SMTP configuration
    // this.transport = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: process.env.SMTP_PORT,
    //   secure: false,
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS
    //   }
    // });
  }

  async sendWaterReminder(userEmail, userName, reminderCount) {
    if (!this.transport) {
      console.log('Email service not configured, skipping email notification');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: '💧 Cherry - Time to Drink Water!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 15px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">💧 Hydration Reminder</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Stay healthy, stay hydrated!</p>
            </div>
            
            <div style="padding: 30px; background: #f8fafc; border-radius: 15px; margin-top: 20px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${userName}! 👋</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                It's time to take a water break! This is your <strong>reminder #${reminderCount}</strong> today.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <h3 style="color: #3b82f6; margin-top: 0;">💡 Hydration Tips:</h3>
                <ul style="color: #6b7280; line-height: 1.6;">
                  <li>Aim for 8 glasses of water daily</li>
                  <li>Drink water before you feel thirsty</li>
                  <li>Add lemon or cucumber for flavor</li>
                  <li>Keep a water bottle nearby</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/dashboard" 
                   style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Open Cherry App
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 14px;">
              <p>This reminder was sent by Cherry - Your Personal Productivity Assistant</p>
              <p>Manage your water reminders in the app settings</p>
            </div>
          </div>
        `
      };

      const result = await this.transport.sendMail(mailOptions);
      console.log(`Water reminder email sent to ${userEmail}:`, result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  async testConnection() {
    if (!this.transport) {
      console.log('Email service not configured');
      return false;
    }

    try {
      await this.transport.verify();
      console.log('Email service connected successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();

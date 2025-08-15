import express from 'express';
import WaterReminder from '../models/WaterReminder.js';
import auth from '../middleware/auth.js';
import { notificationService } from '../services/notificationService.js';

const router = express.Router();

// Store active intervals for each user
const activeIntervals = new Map();

// Enhanced notification function with multiple delivery methods
const sendWaterNotification = async (userId, reminderCount) => {
  const reminderData = {
    reminderCount,
    timestamp: new Date().toISOString(),
    type: 'water-reminder'
  };
  
  return await notificationService.sendWaterReminder(userId, reminderData);
};

// Helper function to start interval for a user
const startWaterReminderInterval = async (userId, intervalMinutes) => {
  // Clear existing interval if any
  if (activeIntervals.has(userId)) {
    clearInterval(activeIntervals.get(userId));
  }

  const intervalMs = intervalMinutes * 60 * 1000;
  
  const intervalId = setInterval(async () => {
    try {
      const reminder = await WaterReminder.findOne({ userId, isActive: true });
      if (!reminder) {
        clearInterval(intervalId);
        activeIntervals.delete(userId);
        return;
      }

      // Reset daily counter if needed
      reminder.resetDailyCounterIfNeeded();
      
      // Increment reminder count
      reminder.totalRemindersToday += 1;
      reminder.lastNotificationSent = new Date();
      reminder.calculateNextNotification();
      
      await reminder.save();

      // Send notification
      sendWaterNotification(userId, reminder.totalRemindersToday);
      
    } catch (error) {
      console.error('Error in water reminder interval:', error);
    }
  }, intervalMs);

  activeIntervals.set(userId, intervalId);
};

// Set or update water reminder
router.post('/set', auth, async (req, res) => {
  try {
    const { intervalMinutes } = req.body;
    
    if (!intervalMinutes || intervalMinutes < 1 || intervalMinutes > 1440) {
      return res.status(400).json({ 
        message: 'Invalid interval. Must be between 1 and 1440 minutes (24 hours)' 
      });
    }

    let reminder = await WaterReminder.findOne({ userId: req.userId });
    
    if (reminder) {
      // Update existing reminder
      reminder.intervalMinutes = intervalMinutes;
      reminder.isActive = true;
      reminder.resetDailyCounterIfNeeded();
      reminder.calculateNextNotification();
    } else {
      // Create new reminder
      reminder = new WaterReminder({
        userId: req.userId,
        intervalMinutes,
        isActive: true
      });
      reminder.calculateNextNotification();
    }
    
    await reminder.save();
    
    // Start the interval
    startWaterReminderInterval(req.userId, intervalMinutes);
    
    res.json({
      message: 'Water reminder set successfully',
      reminder: {
        intervalMinutes: reminder.intervalMinutes,
        nextNotificationTime: reminder.nextNotificationTime,
        isActive: reminder.isActive,
        totalRemindersToday: reminder.totalRemindersToday
      }
    });
  } catch (error) {
    console.error('Set water reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current water reminder status
router.get('/status', auth, async (req, res) => {
  try {
    const reminder = await WaterReminder.findOne({ userId: req.userId });
    
    if (!reminder) {
      return res.json({
        isActive: false,
        message: 'No water reminder set'
      });
    }

    // Reset daily counter if needed
    reminder.resetDailyCounterIfNeeded();
    await reminder.save();

    res.json({
      isActive: reminder.isActive,
      intervalMinutes: reminder.intervalMinutes,
      nextNotificationTime: reminder.nextNotificationTime,
      lastNotificationSent: reminder.lastNotificationSent,
      totalRemindersToday: reminder.totalRemindersToday,
      timeUntilNext: reminder.nextNotificationTime ? 
        Math.max(0, Math.ceil((reminder.nextNotificationTime - new Date()) / 1000 / 60)) : null
    });
  } catch (error) {
    console.error('Get water reminder status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pause/Resume water reminder
router.patch('/toggle', auth, async (req, res) => {
  try {
    const reminder = await WaterReminder.findOne({ userId: req.userId });
    
    if (!reminder) {
      return res.status(404).json({ message: 'No water reminder found' });
    }

    reminder.isActive = !reminder.isActive;
    
    if (reminder.isActive) {
      reminder.calculateNextNotification();
      startWaterReminderInterval(req.userId, reminder.intervalMinutes);
    } else {
      // Clear interval when paused
      if (activeIntervals.has(req.userId)) {
        clearInterval(activeIntervals.get(req.userId));
        activeIntervals.delete(req.userId);
      }
    }
    
    await reminder.save();
    
    res.json({
      message: `Water reminder ${reminder.isActive ? 'resumed' : 'paused'}`,
      isActive: reminder.isActive,
      nextNotificationTime: reminder.nextNotificationTime
    });
  } catch (error) {
    console.error('Toggle water reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete water reminder
router.delete('/remove', auth, async (req, res) => {
  try {
    const reminder = await WaterReminder.findOneAndDelete({ userId: req.userId });
    
    if (!reminder) {
      return res.status(404).json({ message: 'No water reminder found' });
    }

    // Clear interval
    if (activeIntervals.has(req.userId)) {
      clearInterval(activeIntervals.get(req.userId));
      activeIntervals.delete(req.userId);
    }
    
    res.json({ message: 'Water reminder removed successfully' });
  } catch (error) {
    console.error('Delete water reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manual water intake log (bonus feature)
router.post('/drink', auth, async (req, res) => {
  try {
    const reminder = await WaterReminder.findOne({ userId: req.userId });
    
    if (reminder) {
      reminder.resetDailyCounterIfNeeded();
      // Reset the timer when user manually logs water intake
      reminder.calculateNextNotification();
      await reminder.save();
      
      // Restart interval with fresh timer
      if (reminder.isActive) {
        startWaterReminderInterval(req.userId, reminder.intervalMinutes);
      }
    }
    
    res.json({ 
      message: 'Water intake logged! Timer reset.',
      nextNotificationTime: reminder?.nextNotificationTime
    });
  } catch (error) {
    console.error('Log water intake error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Initialize active reminders on server start
export const initializeWaterReminders = async () => {
  try {
    const activeReminders = await WaterReminder.find({ isActive: true });
    
    for (const reminder of activeReminders) {
      startWaterReminderInterval(reminder.userId.toString(), reminder.intervalMinutes);
    }
    
    console.log(`Initialized ${activeReminders.length} water reminders`);
  } catch (error) {
    console.error('Error initializing water reminders:', error);
  }
};

export default router;

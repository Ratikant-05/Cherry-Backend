import mongoose from 'mongoose';

const waterReminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  intervalMinutes: {
    type: Number,
    required: true,
    min: 1,
    max: 1440 // Max 24 hours
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastNotificationSent: {
    type: Date,
    default: null
  },
  nextNotificationTime: {
    type: Date,
    default: null
  },
  totalRemindersToday: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to calculate next notification time
waterReminderSchema.methods.calculateNextNotification = function() {
  const now = new Date();
  this.nextNotificationTime = new Date(now.getTime() + (this.intervalMinutes * 60 * 1000));
  return this.nextNotificationTime;
};

// Method to reset daily counter if it's a new day
waterReminderSchema.methods.resetDailyCounterIfNeeded = function() {
  const now = new Date();
  const lastReset = new Date(this.lastResetDate);
  
  // Check if it's a new day
  if (now.toDateString() !== lastReset.toDateString()) {
    this.totalRemindersToday = 0;
    this.lastResetDate = now;
  }
};

export default mongoose.model('WaterReminder', waterReminderSchema);

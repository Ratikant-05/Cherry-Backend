import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    // Store date without time for daily grouping
    set: function(value) {
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      return date;
    }
  },
  activities: [{
    hour: {
      type: Number,
      required: true,
      min: 0,
      max: 23
    },
    activity: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    category: {
      type: String,
      enum: ['work', 'personal', 'health', 'education', 'entertainment', 'social', 'other'],
      default: 'other'
    },
    mood: {
      type: String,
      enum: ['excellent', 'good', 'neutral', 'poor', 'terrible'],
      default: 'neutral'
    },
    productivity: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
activityLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Index for activity hour within a day
activityLogSchema.index({ 'activities.hour': 1 });

// Pre-save middleware to update timestamps
activityLogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update individual activity timestamps
  this.activities.forEach(activity => {
    if (activity.isModified() || activity.isNew) {
      activity.updatedAt = Date.now();
    }
  });
  
  next();
});

// Method to add or update activity for a specific hour
activityLogSchema.methods.setHourActivity = function(hour, activityData) {
  const existingActivityIndex = this.activities.findIndex(a => a.hour === hour);
  
  if (existingActivityIndex !== -1) {
    // Update existing activity
    Object.assign(this.activities[existingActivityIndex], {
      ...activityData,
      hour,
      updatedAt: Date.now()
    });
  } else {
    // Add new activity
    this.activities.push({
      ...activityData,
      hour,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
  
  // Sort activities by hour
  this.activities.sort((a, b) => a.hour - b.hour);
};

// Method to get activity for a specific hour
activityLogSchema.methods.getHourActivity = function(hour) {
  return this.activities.find(a => a.hour === hour);
};

// Method to remove activity for a specific hour
activityLogSchema.methods.removeHourActivity = function(hour) {
  this.activities = this.activities.filter(a => a.hour !== hour);
};

// Static method to find or create daily log
activityLogSchema.statics.findOrCreateDailyLog = async function(userId, date) {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  
  let log = await this.findOne({ userId, date: normalizedDate });
  
  if (!log) {
    log = new this({
      userId,
      date: normalizedDate,
      activities: []
    });
    await log.save();
  }
  
  return log;
};

// Static method to get activity logs for a date range
activityLogSchema.statics.getLogsInRange = async function(userId, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return this.find({
    userId,
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });
};

export default mongoose.model('ActivityLog', activityLogSchema);

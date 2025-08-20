import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get activity log for a specific date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.id;
    
    const log = await ActivityLog.findOrCreateDailyLog(userId, date);
    res.json(log);
  } catch (error) {
    console.error('Error fetching daily activity log:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activity logs for a date range
router.get('/range', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const logs = await ActivityLog.getLogsInRange(userId, startDate, endDate);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs range:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add or update activity for a specific hour
router.post('/activity', auth, async (req, res) => {
  try {
    const { date, hour, activity, category, mood, productivity, notes } = req.body;
    const userId = req.user.id;
    
    // Validation
    if (!date || hour === undefined || !activity) {
      return res.status(400).json({ 
        message: 'Date, hour, and activity are required' 
      });
    }
    
    if (hour < 0 || hour > 23) {
      return res.status(400).json({ 
        message: 'Hour must be between 0 and 23' 
      });
    }
    
    if (activity.length > 200) {
      return res.status(400).json({ 
        message: 'Activity description must be 200 characters or less' 
      });
    }
    
    const log = await ActivityLog.findOrCreateDailyLog(userId, date);
    
    log.setHourActivity(hour, {
      activity: activity.trim(),
      category: category || 'other',
      mood: mood || 'neutral',
      productivity: productivity || 3,
      notes: notes ? notes.trim() : ''
    });
    
    await log.save();
    res.json(log);
  } catch (error) {
    console.error('Error adding/updating activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update specific activity
router.put('/activity', auth, async (req, res) => {
  try {
    const { date, hour, activity, category, mood, productivity, notes } = req.body;
    const userId = req.user.id;
    
    // Validation
    if (!date || hour === undefined) {
      return res.status(400).json({ 
        message: 'Date and hour are required' 
      });
    }
    
    if (hour < 0 || hour > 23) {
      return res.status(400).json({ 
        message: 'Hour must be between 0 and 23' 
      });
    }
    
    const log = await ActivityLog.findOne({ 
      userId, 
      date: new Date(date).setHours(0, 0, 0, 0) 
    });
    
    if (!log) {
      return res.status(404).json({ message: 'Activity log not found for this date' });
    }
    
    const existingActivity = log.getHourActivity(hour);
    if (!existingActivity) {
      return res.status(404).json({ message: 'No activity found for this hour' });
    }
    
    // Update only provided fields
    const updateData = {};
    if (activity !== undefined) updateData.activity = activity.trim();
    if (category !== undefined) updateData.category = category;
    if (mood !== undefined) updateData.mood = mood;
    if (productivity !== undefined) updateData.productivity = productivity;
    if (notes !== undefined) updateData.notes = notes.trim();
    
    log.setHourActivity(hour, { ...existingActivity.toObject(), ...updateData });
    await log.save();
    
    res.json(log);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete activity for a specific hour
router.delete('/activity', auth, async (req, res) => {
  try {
    const { date, hour } = req.body;
    const userId = req.user.id;
    
    if (!date || hour === undefined) {
      return res.status(400).json({ 
        message: 'Date and hour are required' 
      });
    }
    
    const log = await ActivityLog.findOne({ 
      userId, 
      date: new Date(date).setHours(0, 0, 0, 0) 
    });
    
    if (!log) {
      return res.status(404).json({ message: 'Activity log not found for this date' });
    }
    
    log.removeHourActivity(hour);
    await log.save();
    
    res.json(log);
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activity statistics for a user
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    const matchConditions = { userId };
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      matchConditions.date = { $gte: start, $lte: end };
    }
    
    const stats = await ActivityLog.aggregate([
      { $match: matchConditions },
      { $unwind: '$activities' },
      {
        $group: {
          _id: null,
          totalActivities: { $sum: 1 },
          avgProductivity: { $avg: '$activities.productivity' },
          categoryBreakdown: {
            $push: '$activities.category'
          },
          moodBreakdown: {
            $push: '$activities.mood'
          },
          hourlyDistribution: {
            $push: '$activities.hour'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalActivities: 1,
          avgProductivity: { $round: ['$avgProductivity', 2] },
          categoryBreakdown: 1,
          moodBreakdown: 1,
          hourlyDistribution: 1
        }
      }
    ]);
    
    if (stats.length === 0) {
      return res.json({
        totalActivities: 0,
        avgProductivity: 0,
        categoryBreakdown: [],
        moodBreakdown: [],
        hourlyDistribution: []
      });
    }
    
    const result = stats[0];
    
    // Process category breakdown
    const categoryCount = {};
    result.categoryBreakdown.forEach(cat => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    // Process mood breakdown
    const moodCount = {};
    result.moodBreakdown.forEach(mood => {
      moodCount[mood] = (moodCount[mood] || 0) + 1;
    });
    
    // Process hourly distribution
    const hourlyCount = {};
    result.hourlyDistribution.forEach(hour => {
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    });
    
    res.json({
      totalActivities: result.totalActivities,
      avgProductivity: result.avgProductivity,
      categoryBreakdown: categoryCount,
      moodBreakdown: moodCount,
      hourlyDistribution: hourlyCount
    });
  } catch (error) {
    console.error('Error fetching activity statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's activity log (convenience endpoint)
router.get('/today', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    
    const log = await ActivityLog.findOrCreateDailyLog(userId, today);
    res.json(log);
  } catch (error) {
    console.error('Error fetching today\'s activity log:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

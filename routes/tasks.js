import express from 'express';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Test route to check database connection
router.get('/test', async (req, res) => {
  try {
    const count = await Task.countDocuments();
    console.log('Database test - Total tasks:', count);
    res.json({ message: 'Database connection working', totalTasks: count });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

// Get all tasks for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Get tasks request:', {
      userId: req.userId,
      query: req.query
    });
    
    const { status, priority, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let filter = { userId: req.userId };
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    console.log('Task filter:', filter);
    
    const sortOrder = order === 'asc' ? 1 : -1;
    
    const tasks = await Task.find(filter)
      .sort({ [sortBy]: sortOrder })
      .populate('userId', 'name email');
    
    console.log('Tasks found:', tasks.length);
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    console.log('Create task request:', {
      userId: req.userId,
      taskData: req.body
    });
    
    const taskData = {
      ...req.body,
      userId: req.userId
    };
    
    const task = new Task(taskData);
    await task.save();
    
    console.log('Task created successfully:', task);
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Update task request:', {
      taskId: req.params.id,
      userId: req.userId,
      updateData: req.body
    });
    
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!task) {
      console.log('Task not found for update:', req.params.id, req.userId);
      return res.status(404).json({ message: 'Task not found' });
    }
    
    console.log('Task updated successfully:', task);
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task analytics
router.get('/analytics/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('Analytics request for user:', userId);
    
    // Get task counts by status
    const statusStats = await Task.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Get task counts by priority
    const priorityStats = await Task.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    // Get time analytics
    const timeStats = await Task.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalEstimatedTime: { $sum: '$estimatedTime' },
          totalActualTime: { $sum: '$actualTime' },
          avgEstimatedTime: { $avg: '$estimatedTime' },
          avgActualTime: { $avg: '$actualTime' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get daily task completion for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyStats = await Task.aggregate([
      {
        $match: {
          userId: userId,
          status: 'completed',
          updatedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$updatedAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    const analyticsData = {
      statusStats,
      priorityStats,
      timeStats: timeStats[0] || {
        totalEstimatedTime: 0,
        totalActualTime: 0,
        avgEstimatedTime: 0,
        avgActualTime: 0,
        count: 0
      },
      dailyStats
    };

    console.log('Analytics data being sent:', analyticsData);
    res.json(analyticsData);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

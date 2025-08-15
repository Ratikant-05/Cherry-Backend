import express from 'express';
import webpush from 'web-push';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Configure web-push with VAPID keys (only if keys are provided)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.log('Push notifications not configured - VAPID keys not set');
}

// Subscribe to push notifications
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    
    // Save subscription to user
    await User.findByIdAndUpdate(req.userId, {
      pushSubscription: {
        endpoint,
        keys
      }
    });

    res.json({ message: 'Push subscription saved' });
  } catch (error) {
    console.error('Push subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $unset: { pushSubscription: 1 }
    });

    res.json({ message: 'Push subscription removed' });
  } catch (error) {
    console.error('Push unsubscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send push notification (internal use)
export const sendPushNotification = async (userId, payload) => {
  // Check if push notifications are configured
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('Push notifications not configured, skipping push notification');
    return false;
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscription) {
      return false;
    }

    await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Push notification error:', error);
    return false;
  }
};

export default router;

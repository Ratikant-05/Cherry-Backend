# Water Reminder API Documentation

## Overview
The water reminder feature allows users to set periodic notifications to drink water at custom intervals.

## Endpoints

### 1. Set Water Reminder
**POST** `/api/water-reminder/set`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "intervalMinutes": 30
}
```

**Response:**
```json
{
  "message": "Water reminder set successfully",
  "reminder": {
    "intervalMinutes": 30,
    "nextNotificationTime": "2024-01-15T14:48:00.000Z",
    "isActive": true,
    "totalRemindersToday": 0
  }
}
```

### 2. Get Reminder Status
**GET** `/api/water-reminder/status`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "isActive": true,
  "intervalMinutes": 30,
  "nextNotificationTime": "2024-01-15T14:48:00.000Z",
  "lastNotificationSent": "2024-01-15T14:18:00.000Z",
  "totalRemindersToday": 3,
  "timeUntilNext": 25
}
```

### 3. Pause/Resume Reminder
**PATCH** `/api/water-reminder/toggle`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "message": "Water reminder paused",
  "isActive": false,
  "nextNotificationTime": null
}
```

### 4. Remove Reminder
**DELETE** `/api/water-reminder/remove`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "message": "Water reminder removed successfully"
}
```

### 5. Log Water Intake (Manual)
**POST** `/api/water-reminder/drink`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "message": "Water intake logged! Timer reset.",
  "nextNotificationTime": "2024-01-15T15:18:00.000Z"
}
```

## Features

- **Custom Intervals**: Set reminders from 1 minute to 24 hours (1440 minutes)
- **Daily Tracking**: Counts how many reminders sent today
- **Pause/Resume**: Toggle reminders without losing settings
- **Manual Reset**: Log water intake to reset the timer
- **Persistent**: Reminders continue even after server restart
- **Auto-Reset**: Daily counters reset at midnight

## Usage Examples

### Setting a 30-minute reminder:
```bash
curl -X POST http://localhost:5000/api/water-reminder/set \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"intervalMinutes": 30}'
```

### Checking status:
```bash
curl -X GET http://localhost:5000/api/water-reminder/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes

- Notifications are currently logged to console (in production, integrate with push notification services)
- Each user can have only one active water reminder
- The system automatically handles timezone and daily resets
- Reminders are user-specific and require authentication

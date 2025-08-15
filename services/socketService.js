import { Server } from 'socket.io';

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socketId mapping
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          "http://localhost:5173",
          "https://cherry-frontend.vercel.app",
          process.env.FRONTEND_URL
        ].filter(Boolean),
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Handle user authentication
      socket.on('authenticate', (userId) => {
        if (userId) {
          this.userSockets.set(userId, socket.id);
          socket.userId = userId;
          console.log(`User ${userId} authenticated with socket ${socket.id}`);
        }
      });

      // Handle water reminder acknowledgment
      socket.on('water-reminder-ack', (data) => {
        console.log(`Water reminder acknowledged by user ${socket.userId}:`, data);
      });

      socket.on('disconnect', () => {
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
          console.log(`User ${socket.userId} disconnected`);
        }
      });
    });

    return this.io;
  }

  // Send water reminder to specific user
  sendWaterReminder(userId, reminderData) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('water-reminder', {
        type: 'water-reminder',
        message: '💧 Time to drink water!',
        reminderCount: reminderData.reminderCount,
        timestamp: new Date().toISOString(),
        ...reminderData
      });
      return true;
    }
    return false;
  }

  // Send notification to specific user
  sendNotification(userId, notification) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
      return true;
    }
    return false;
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.userSockets.size;
  }
}

export const socketService = new SocketService();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { socketService } from './services/socketService.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import routes
import tasksRouter from './routes/tasks.js';
import authRouter from './routes/auth.js';
import waterReminderRouter, { initializeWaterReminders } from './routes/waterReminder.js';
import pushRouter from './routes/push.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/auth', authRouter);
app.use('/api/water-reminder', waterReminderRouter);
app.use('/api/push', pushRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Create HTTP server and initialize Socket.IO
const server = createServer(app);
socketService.initialize(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
});

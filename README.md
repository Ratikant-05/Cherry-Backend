# Cherry Backend 🍒

This is the backend API server for Cherry - Your Personalized Task Manager.

## Tech Stack
- Node.js with ES Modules
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- CORS enabled

## Features
- RESTful API for task management
- User authentication with JWT tokens
- MongoDB database integration
- Task analytics and statistics
- Real-time task operations (CRUD)
- User preferences and settings

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
NODE_ENV=development
PORT=5000
MONGODB_URL=mongodb://localhost:27017/myTodoApp
JWT_SECRET=your-secret-key
```

3. Start the development server:
```bash
npm start
```

4. For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Tasks
- `GET /api/tasks` - Get all tasks for authenticated user
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/analytics/stats` - Get task analytics

### Health Check
- `GET /api/health` - Server health check

## Project Structure
- `server.js` - Main server file
- `models/` - Mongoose models
- `routes/` - API route handlers
- `middleware/` - Custom middleware (authentication)

## Database Schema
- **User**: name, email, password, preferences
- **Task**: title, description, status, priority, estimatedTime, actualTime, dueDate, userId

## Environment
- Development: http://localhost:5000
- Database: MongoDB (local or Atlas)

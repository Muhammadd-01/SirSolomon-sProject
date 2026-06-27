import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import User from './models/User.js';
import Settings from './models/Settings.js';
import { initCronJobs } from './utils/cronJobs.js';

import authRoutes from './routes/auth.js';
import teacherRoutes from './routes/teachers.js';
import attendanceRoutes from './routes/attendance.js';
import salaryRoutes from './routes/salary.js';
import noticeRoutes from './routes/notices.js';
import dashboardRoutes from './routes/dashboard.js';
import profileRoutes from './routes/profile.js';
import searchRoutes from './routes/search.js';
import notificationRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import reportRoutes from './routes/reports.js';
import errorHandler from './middlewares/errorHandler.js';

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Rate limiting (Only in production)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  });
  app.use('/api', limiter);
}

// Set static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.send('School Management API is running');
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// ─── Start Server ──────────────────────────────────────────
const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Auto-seed default principal credentials & settings
    const adminExists = await User.findOne({ role: 'principal' });
    if (!adminExists) {
      await User.create({
        name: 'Admin Principal',
        email: 'principal@school.com',
        password: 'Password123',
        role: 'principal'
      });
      console.log('✅ Default principal created → principal@school.com / Password123');
    }

    const settingsExist = await Settings.findOne();
    if (!settingsExist) {
      await Settings.create({
        schoolName: 'Greenwood Academy',
        address: '123 Education Lane, City',
        phone: '+923001234567',
        email: 'info@greenwood.edu'
      });
      console.log('✅ Default school settings created.');
    }

    // 3. Start Express
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      initCronJobs();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

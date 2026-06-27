import express from 'express';
import { markAttendance, bulkMarkAttendance, bulkMarkRange, getAttendanceByDate, getAttendanceByUser } from '../controllers/attendanceController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.post('/mark', authorize(ROLES.PRINCIPAL, ROLES.TEACHER), markAttendance);
router.post('/bulk', authorize(ROLES.PRINCIPAL, ROLES.TEACHER), bulkMarkAttendance);
router.post('/bulk-range', authorize(ROLES.PRINCIPAL, ROLES.TEACHER), bulkMarkRange);
router.get('/date', authorize(ROLES.PRINCIPAL, ROLES.TEACHER), getAttendanceByDate);
router.get('/user/:userId', getAttendanceByUser); // User can view their own, others restricted based on logic in controller ideally

export default router;

import express from 'express';
import { getAttendanceReport, getSalaryReport, getFinancialReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.PRINCIPAL, ROLES.TEACHER));

router.get('/attendance', getAttendanceReport);
router.get('/salary', authorize(ROLES.PRINCIPAL), getSalaryReport);
router.get('/financial', authorize(ROLES.PRINCIPAL), getFinancialReport);

export default router;

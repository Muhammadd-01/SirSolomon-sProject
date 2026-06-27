import express from 'express';
import { getDashboardStats, getRecentActivities } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.PRINCIPAL));

router.get('/stats', getDashboardStats);
router.get('/activities', getRecentActivities);

export default router;

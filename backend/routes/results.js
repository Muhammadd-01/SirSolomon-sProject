import express from 'express';
import { enterMarks, bulkEnterMarks, getResults, downloadReportCard } from '../controllers/resultController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getResults)
  .post(authorize(ROLES.PRINCIPAL, ROLES.TEACHER), enterMarks);

router.post('/bulk', authorize(ROLES.PRINCIPAL, ROLES.TEACHER), bulkEnterMarks);
router.get('/student/:studentId/report-card', downloadReportCard);

export default router;

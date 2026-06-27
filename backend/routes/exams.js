import express from 'express';
import { createExam, getExams, getExam, updateExam, deleteExam } from '../controllers/examController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getExams)
  .post(authorize(ROLES.PRINCIPAL, ROLES.TEACHER), createExam);

router.route('/:id')
  .get(getExam)
  .put(authorize(ROLES.PRINCIPAL, ROLES.TEACHER), updateExam)
  .delete(authorize(ROLES.PRINCIPAL, ROLES.TEACHER), deleteExam);

export default router;

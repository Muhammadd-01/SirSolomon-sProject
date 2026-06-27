import express from 'express';
import { getStudents, getStudent, createStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize(ROLES.PRINCIPAL, ROLES.TEACHER), getStudents)
  .post(authorize(ROLES.PRINCIPAL), createStudent);

router.route('/:id')
  .get(getStudent)
  .put(authorize(ROLES.PRINCIPAL), updateStudent)
  .delete(authorize(ROLES.PRINCIPAL), deleteStudent);

export default router;

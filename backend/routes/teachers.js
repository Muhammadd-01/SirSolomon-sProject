import express from 'express';
import { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher } from '../controllers/teacherController.js';
import { protect, authorize } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

// Only principal can manage teachers broadly
router.route('/')
  .get(authorize(ROLES.PRINCIPAL), getTeachers)
  .post(authorize(ROLES.PRINCIPAL), upload.single('profileImage'), createTeacher);

router.route('/:id')
  .get(authorize(ROLES.PRINCIPAL, ROLES.TEACHER), getTeacher)
  .put(authorize(ROLES.PRINCIPAL), upload.single('profileImage'), updateTeacher)
  .delete(authorize(ROLES.PRINCIPAL), deleteTeacher);

export default router;

import express from 'express';
import { getClasses, getClass, createClass, updateClass, deleteClass, assignStudents } from '../controllers/classController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.PRINCIPAL));

router.route('/')
  .get(getClasses)
  .post(createClass);

router.route('/:id')
  .get(getClass)
  .put(updateClass)
  .delete(deleteClass);

router.post('/:id/students', assignStudents);

export default router;

import express from 'express';
import { createNotice, getNotices, getNotice, updateNotice, deleteNotice, togglePin } from '../controllers/noticeController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotices)
  .post(authorize(ROLES.PRINCIPAL), createNotice);

router.route('/:id')
  .get(getNotice)
  .put(authorize(ROLES.PRINCIPAL), updateNotice)
  .delete(authorize(ROLES.PRINCIPAL), deleteNotice);

router.put('/:id/pin', authorize(ROLES.PRINCIPAL), togglePin);

export default router;

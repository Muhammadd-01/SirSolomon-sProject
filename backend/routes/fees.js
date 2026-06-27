import express from 'express';
import { collectFee, getFees, downloadFeeReceipt } from '../controllers/feeController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getFees) // Should filter by user role
  .post(authorize(ROLES.PRINCIPAL, ROLES.TEACHER), collectFee);

router.get('/:id/receipt', downloadFeeReceipt);

export default router;

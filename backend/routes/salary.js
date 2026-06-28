import express from 'express';
import { generateSalary, getSalaries, updateSalaryStatus, downloadSalarySlip, deleteSalary, previewSalary, downloadBulkSalarySlips, downloadBulkSalaryExcel, bulkDeleteSalaries } from '../controllers/salaryController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize(ROLES.PRINCIPAL), getSalaries)
  .post(authorize(ROLES.PRINCIPAL), generateSalary);

router.post('/preview', authorize(ROLES.PRINCIPAL), previewSalary);
router.post('/bulk-delete', authorize(ROLES.PRINCIPAL), bulkDeleteSalaries);
router.get('/bulk/pdf', authorize(ROLES.PRINCIPAL), downloadBulkSalarySlips);
router.get('/bulk/excel', authorize(ROLES.PRINCIPAL), downloadBulkSalaryExcel);
router.put('/:id/status', authorize(ROLES.PRINCIPAL), updateSalaryStatus);
router.delete('/:id', authorize(ROLES.PRINCIPAL), deleteSalary);
router.get('/:id/slip', downloadSalarySlip); // Should verify ownership or principal role in controller

export default router;

import mongoose from 'mongoose';
import { SALARY_STATUS } from '../config/constants.js';

const salarySchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    totalWorkingDays: {
      type: Number,
      required: true,
    },
    perDaySalary: {
      type: Number,
      default: 0,
    },
    // Attendance Stats
    presentDays: {
      type: Number,
      default: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    lateDays: {
      type: Number,
      default: 0,
    },
    // Deductions
    absenceDeduction: {
      type: Number,
      default: 0,
    },
    absenceDueToLate: {
      type: Number,
      default: 0,
    },
    lateAbsenceDeduction: {
      type: Number,
      default: 0,
    },
    advance: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    grossPay: {
      type: Number,
      default: 0,
    },
    // Allowances
    attendanceAllowance: {
      type: Number,
      default: 0,
    },
    punctualityAllowance: {
      type: Number,
      default: 0,
    },
    totalAllowance: {
      type: Number,
      default: 0,
    },
    // Custom salary components from Settings
    customAdditions: {
      type: Number,
      default: 0,
    },
    customDeductions: {
      type: Number,
      default: 0,
    },
    appliedComponents: {
      type: [{
        name: String,
        type: { type: String, enum: ['addition', 'deduction'] },
        originalAmount: Number,
        isPercentage: Boolean,
        calculatedAmount: Number,
      }],
      default: [],
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    netPay: {
      type: Number,
      default: 0,
    },
    // Additions
    juneSalary: {
      type: Number,
      default: 0,
    },
    julySalary: {
      type: Number,
      default: 0,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    totalAdditions: {
      type: Number,
      default: 0,
    },
    payableSalary: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(SALARY_STATUS),
      default: SALARY_STATUS.PENDING,
    },
    paidDate: Date,
    transactionId: String,
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

salarySchema.index({ teacher: 1, month: 1, year: 1 }, { unique: true });

const Salary = mongoose.model('Salary', salarySchema);
export default Salary;

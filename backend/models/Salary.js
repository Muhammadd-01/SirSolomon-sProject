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
    allowances: {
      type: Number,
      default: 0,
    },
    bonuses: {
      type: Number,
      default: 0,
    },
    vacationPay: {
      type: Number,
      default: 0,
    },
    overtime: {
      hours: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    grossSalary: Number,
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
    taxDeduction: {
      type: Number,
      default: 0,
    },
    leaveDeductions: {
      type: Number,
      default: 0,
    },
    lateDeductions: {
      type: Number,
      default: 0,
    },
    advance: {
      type: Number,
      default: 0,
    },
    netSalary: Number,
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

salarySchema.pre('save', function (next) {
  // Calculate overtime total
  if (this.overtime && this.overtime.hours && this.overtime.rate) {
    this.overtime.total = this.overtime.hours * this.overtime.rate;
  }

  // Calculate gross salary
  this.grossSalary = this.basicSalary + this.allowances + this.bonuses + this.vacationPay + (this.overtime ? this.overtime.total : 0);

  // Calculate net salary
  this.netSalary = this.grossSalary - this.taxDeduction - this.leaveDeductions - this.lateDeductions - this.advance;

  next();
});

salarySchema.index({ teacher: 1, month: 1, year: 1 }, { unique: true });

const Salary = mongoose.model('Salary', salarySchema);
export default Salary;

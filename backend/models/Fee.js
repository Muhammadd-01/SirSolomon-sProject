import mongoose from 'mongoose';
import { FEE_STATUS } from '../config/constants.js';

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    amount: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    scholarship: {
      type: Number,
      default: 0,
    },
    netAmount: Number,
    status: {
      type: String,
      enum: Object.values(FEE_STATUS),
      default: FEE_STATUS.PENDING,
    },
    paidDate: Date,
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    month: Number,
    year: Number,
    remarks: String,
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

feeSchema.pre('save', function (next) {
  this.netAmount = this.amount - this.discount - this.scholarship;
  next();
});

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;

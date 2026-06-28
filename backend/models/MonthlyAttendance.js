import mongoose from 'mongoose';

const monthlyAttendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    absentCount: {
      type: Number,
      default: 0,
    },
    lateCount: {
      type: Number,
      default: 0,
    },
    halfDayCount: {
      type: Number,
      default: 0,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate monthly attendance for same user
monthlyAttendanceSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

const MonthlyAttendance = mongoose.model('MonthlyAttendance', monthlyAttendanceSchema);
export default MonthlyAttendance;

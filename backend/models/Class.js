import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      unique: true,
    },
    sections: {
      type: [String],
      default: ['A'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    subjects: [
      {
        name: String,
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Teacher',
        },
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    roomNumber: {
      type: String,
    },
    timetable: [
      {
        day: String,
        periods: [
          {
            subject: String,
            teacher: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Teacher',
            },
            startTime: String,
            endTime: String,
          },
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Class = mongoose.model('Class', classSchema);
export default Class;

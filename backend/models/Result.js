import mongoose from 'mongoose';
import { GRADE_SCALE } from '../config/constants.js';

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    percentage: Number,
    grade: String,
    remarks: String,
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.pre('save', function (next) {
  this.percentage = (this.marksObtained / this.totalMarks) * 100;
  
  let assignedGrade = 'F';
  for (const gradeObj of GRADE_SCALE) {
    if (this.percentage >= gradeObj.minMarks) {
      assignedGrade = gradeObj.grade;
      break;
    }
  }
  this.grade = assignedGrade;

  next();
});

resultSchema.index({ student: 1, exam: 1 }, { unique: true });

const Result = mongoose.model('Result', resultSchema);
export default Result;

import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    guardianName: {
      type: String, // S/o, D/o, W/o
    },
    cnic: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    address: {
      type: String,
    },
    reference: {
      type: String,
    },
    academicQualification: {
      type: String, // E.g., MA, MSc
    },
    professionalQualification: {
      type: String, // E.g., B.Ed, M.Ed
    },
    experience: {
      type: String,
    },
    previousSchool: {
      type: String,
    },
    subjects: [
      {
        type: String,
      },
    ],
    assignedClass: {
      type: String,
    },
    assignedSection: {
      type: String,
      enum: ['Prep', 'Primary', 'Secondary', 'College', ''],
    },
    department: {
      type: String, // Teaching / Non Teaching
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    dateOfLeaving: {
      type: Date,
    },
    basicSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    allowance: {
      type: Number,
      default: 0,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    overtimeRate: {
      type: Number,
      default: 0,
    },
    bankAccount: {
      type: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    remarks: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Active', 'Left', 'Suspended'],
      default: 'Active',
    },
    profileImage: {
      type: String,
    },
    documents: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;

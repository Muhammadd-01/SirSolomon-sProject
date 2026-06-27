import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      default: 'School Management Portal',
    },
    logo: String,
    address: String,
    phone: String,
    email: String,
    theme: {
      type: String,
      default: 'light',
    },
    academicYear: String,
    feeStructure: {
      monthly: Number,
      admission: Number,
      exam: Number,
    },
    // Custom salary components configured by principal
    salaryComponents: {
      type: [{
        name: { type: String, required: true },
        type: { type: String, enum: ['addition', 'deduction'], required: true },
        defaultAmount: { type: Number, default: 0 },
        isPercentage: { type: Boolean, default: false },
      }],
      default: [],
    },
    taxPercentage: {
      type: Number,
      default: 0,
    },
    signInCutoff: {
      type: String,
      default: '07:55',
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;

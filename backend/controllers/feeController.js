import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import { generateFeeReceiptPDF } from '../utils/generatePDF.js';
import { FEE_STATUS } from '../config/constants.js';

export const collectFee = async (req, res, next) => {
  try {
    const { studentId, amount, discount = 0, scholarship = 0, month, year, remarks } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const receiptNumber = `FEE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const fee = await Fee.create({
      student: studentId,
      class: student.class,
      amount,
      discount,
      scholarship,
      month,
      year,
      remarks,
      receiptNumber,
      status: FEE_STATUS.PAID,
      paidDate: Date.now(),
      collectedBy: req.user._id
    });

    res.status(201).json({ success: true, data: fee });
  } catch (error) {
    next(error);
  }
};

export const getFees = async (req, res, next) => {
  try {
    const { studentId, classId, month, year, status } = req.query;
    let query = {};

    if (studentId) query.student = studentId;
    if (classId) query.class = classId;
    if (month) query.month = month;
    if (year) query.year = year;
    if (status) query.status = status;

    const fees = await Fee.find(query)
      .populate('student', 'fullName rollNumber')
      .populate('class', 'className');
      
    res.status(200).json({ success: true, data: fees });
  } catch (error) {
    next(error);
  }
};

export const downloadFeeReceipt = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('student', 'fullName rollNumber')
      .populate('class', 'className');
      
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    generateFeeReceiptPDF(fee, res);
  } catch (error) {
    next(error);
  }
};

import Result from '../models/Result.js';
import Exam from '../models/Exam.js';
import Student from '../models/Student.js';
import { generateReportCardPDF } from '../utils/generatePDF.js';

export const enterMarks = async (req, res, next) => {
  try {
    const { studentId, examId, marksObtained, remarks } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (marksObtained > exam.totalMarks) {
      return res.status(400).json({ success: false, message: 'Marks obtained cannot exceed total marks' });
    }

    let result = await Result.findOne({ student: studentId, exam: examId });

    if (result) {
      result.marksObtained = marksObtained;
      result.remarks = remarks;
      result.enteredBy = req.user._id;
      await result.save();
    } else {
      result = await Result.create({
        student: studentId,
        exam: examId,
        marksObtained,
        totalMarks: exam.totalMarks,
        remarks,
        enteredBy: req.user._id
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const bulkEnterMarks = async (req, res, next) => {
  try {
    const { examId, results } = req.body; // results: [{studentId, marksObtained}]

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const operations = results.map(record => ({
      updateOne: {
        filter: { student: record.studentId, exam: examId },
        update: {
          $set: {
            marksObtained: record.marksObtained,
            totalMarks: exam.totalMarks,
            enteredBy: req.user._id
          }
        },
        upsert: true
      }
    }));

    await Result.bulkWrite(operations);

    // Fetch updated to trigger pre-save hooks (bulkWrite bypasses them usually, but for complex logic we might need to iterate.
    // For now, since grade is simple, we assume the pre-save is needed.
    // Better approach: fetch all and save individually to trigger pre-save
    const updatedResults = await Result.find({ exam: examId });
    for(let res of updatedResults) {
        await res.save(); // Trigger calculate grade
    }

    res.status(200).json({ success: true, message: 'Bulk marks entered successfully' });
  } catch (error) {
    next(error);
  }
};

export const getResults = async (req, res, next) => {
  try {
    const { examId, studentId } = req.query;
    let query = {};
    if (examId) query.exam = examId;
    if (studentId) query.student = studentId;

    const results = await Result.find(query)
      .populate('student', 'fullName rollNumber')
      .populate({
        path: 'exam',
        populate: { path: 'subject', select: 'name' }
      });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export const downloadReportCard = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const student = await Student.findById(studentId).populate('class');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const results = await Result.find({ student: studentId }).populate({
      path: 'exam',
      populate: { path: 'subject' }
    });

    generateReportCardPDF(student, results, res);
  } catch (error) {
    next(error);
  }
};

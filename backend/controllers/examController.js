import Exam from '../models/Exam.js';

export const createExam = async (req, res, next) => {
  try {
    const exam = await Exam.create({
      ...req.body,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

export const getExams = async (req, res, next) => {
  try {
    const { classId, subjectId, type } = req.query;
    let query = {};
    
    if (classId) query.class = classId;
    if (subjectId) query.subject = subjectId;
    if (type) query.examType = type;

    const exams = await Exam.find(query)
      .populate('class', 'className')
      .populate('subject', 'name');
      
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    next(error);
  }
};

export const getExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('class', 'className')
      .populate('subject', 'name');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.status(200).json({ success: true, message: 'Exam deleted' });
  } catch (error) {
    next(error);
  }
};

import Class from '../models/Class.js';
import Student from '../models/Student.js';

export const getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find()
      .populate('teacher', 'fullName')
      .populate('subjects.teacher', 'fullName');
      
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
};

export const getClass = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate('teacher', 'fullName')
      .populate('subjects.teacher', 'fullName')
      .populate('students', 'fullName rollNumber');
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    res.status(200).json({ success: true, data: cls });
  } catch (error) {
    next(error);
  }
};

export const createClass = async (req, res, next) => {
  try {
    const newClass = await Class.create(req.body);
    res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req, res, next) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedClass) return res.status(404).json({ success: false, message: 'Class not found' });
    res.status(200).json({ success: true, data: updatedClass });
  } catch (error) {
    next(error);
  }
};

export const deleteClass = async (req, res, next) => {
  try {
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    
    // Remove class reference from students
    await Student.updateMany({ class: req.params.id }, { $unset: { class: 1 } });
    
    res.status(200).json({ success: true, message: 'Class deleted' });
  } catch (error) {
    next(error);
  }
};

export const assignStudents = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    const cls = await Class.findById(req.params.id);
    
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    
    // Prevent duplicates
    const newStudents = studentIds.filter(id => !cls.students.includes(id));
    cls.students.push(...newStudents);
    await cls.save();
    
    // Update student documents
    await Student.updateMany({ _id: { $in: studentIds } }, { class: cls._id });
    
    res.status(200).json({ success: true, data: cls });
  } catch (error) {
    next(error);
  }
};

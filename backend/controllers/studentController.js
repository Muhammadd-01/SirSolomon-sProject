import Student from '../models/Student.js';
import User from '../models/User.js';
import { ROLES } from '../config/constants.js';

export const getStudents = async (req, res, next) => {
  try {
    const { search, classId, section, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (classId) query.class = classId;
    if (section) query.section = section;
    if (status) query.status = status;

    const students = await Student.find(query)
      .populate('user', 'email isActive lastLogin')
      .populate('class', 'className');
      
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};

export const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'email isActive lastLogin')
      .populate('class', 'className');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const { email, password, fullName, rollNumber, ...studentData } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'User with this email already exists' });

    const user = await User.create({
      name: fullName,
      email,
      password,
      role: ROLES.STUDENT,
    });

    const student = await Student.create({
      user: user._id,
      fullName,
      rollNumber,
      ...studentData,
    });

    res.status(201).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    if (req.body.fullName) {
      await User.findByIdAndUpdate(student.user, { name: req.body.fullName });
    }
    
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    student.status = 'inactive';
    await student.save();
    await User.findByIdAndUpdate(student.user, { isActive: false });

    res.status(200).json({ success: true, message: 'Student deleted (inactive)' });
  } catch (error) {
    next(error);
  }
};

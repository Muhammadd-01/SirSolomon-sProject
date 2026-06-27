import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import { ROLES } from '../config/constants.js';
import Salary from '../models/Salary.js';

export const getTeachers = async (req, res, next) => {
  try {
    const { search, department, status, subject } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (department) query.department = department;
    if (status) query.status = status;
    if (subject) query.subjects = { $in: [subject] };

    const teachers = await Teacher.find(query).populate('user', 'email isActive lastLogin profileImage');
    res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    next(error);
  }
};

export const getTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('user', 'email isActive lastLogin profileImage');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

export const createTeacher = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, basicSalary, ...teacherData } = req.body;

    // Handle profile image if uploaded
    let profileImage = '';
    if (req.file) {
      profileImage = `/uploads/${req.file.filename}`;
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'User with this email already exists' });

    const user = await User.create({
      name: fullName,
      email,
      password,
      role: ROLES.TEACHER,
      profileImage, // save to user profile as well
    });

    const teacher = await Teacher.create({
      user: user._id,
      fullName,
      email,
      phone,
      basicSalary: basicSalary || 0,
      profileImage,
      ...teacherData,
    });

    res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

export const updateTeacher = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    const teacher = await Teacher.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    
    // Update User model fields if changed
    const userUpdates = {};
    if (updateData.fullName) userUpdates.name = updateData.fullName;
    if (updateData.profileImage) userUpdates.profileImage = updateData.profileImage;

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(teacher.user, userUpdates);
    }
    
    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

export const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    if (req.query.hard === 'true') {
      // Delete all salary records for this teacher
      await Salary.deleteMany({ teacher: teacher._id });
      await User.findByIdAndDelete(teacher.user);
      await teacher.deleteOne();
      return res.status(200).json({ success: true, message: 'Teacher permanently deleted' });
    }

    // Soft delete / mark as Left
    teacher.status = 'Left';
    if (!teacher.dateOfLeaving) {
      teacher.dateOfLeaving = new Date();
    }
    await teacher.save();
    await User.findByIdAndUpdate(teacher.user, { isActive: false });

    res.status(200).json({ success: true, message: 'Teacher marked as Left' });
  } catch (error) {
    next(error);
  }
};

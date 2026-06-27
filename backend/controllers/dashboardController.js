import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Fee from '../models/Fee.js';
import Salary from '../models/Salary.js';
import Attendance from '../models/Attendance.js';
import ActivityLog from '../models/ActivityLog.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments({ status: 'active' });
    const totalTeachers = await Teacher.countDocuments({ status: 'active' });
    const totalClasses = await Class.countDocuments({ isActive: true });

    // Current month revenue & expenses
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const fees = await Fee.aggregate([
      { $match: { status: 'paid', month: currentMonth, year: currentYear } },
      { $group: { _id: null, totalRevenue: { $sum: '$netAmount' } } }
    ]);
    const monthlyRevenue = fees.length > 0 ? fees[0].totalRevenue : 0;

    const salaries = await Salary.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      { $group: { _id: null, totalExpenses: { $sum: '$netSalary' } } }
    ]);
    const salaryExpenses = salaries.length > 0 ? salaries[0].totalExpenses : 0;

    // Today's attendance
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const presentTeachers = await Attendance.countDocuments({
      role: 'teacher',
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'present'
    });

    const presentStudents = await Attendance.countDocuments({
      role: 'student',
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'present'
    });

    const todayAttendancePercentage = totalStudents > 0 ? ((presentStudents / totalStudents) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        monthlyRevenue,
        salaryExpenses,
        presentTeachers,
        presentStudents,
        todayAttendancePercentage
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivities = async (req, res, next) => {
  try {
    const activities = await ActivityLog.find()
      .populate('user', 'name profileImage role')
      .sort({ createdAt: -1 })
      .limit(10);
      
    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

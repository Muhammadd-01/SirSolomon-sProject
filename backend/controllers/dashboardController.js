import Teacher from '../models/Teacher.js';
import Salary from '../models/Salary.js';
import Attendance from '../models/Attendance.js';
import ActivityLog from '../models/ActivityLog.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalTeachers = await Teacher.countDocuments({ status: { $regex: /^active$/i } });

    // Current month revenue & expenses
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Generate last 6 months list for charting
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentDate.getMonth() - i, 1);
      last6Months.push({ month: d.getMonth() + 1, year: d.getFullYear(), name: d.toLocaleString('default', { month: 'short' }) });
    }



    const salaries = await Salary.aggregate([
      { $match: { month: currentMonth, year: currentYear } },
      { $group: { _id: null, totalExpenses: { $sum: '$netSalary' } } }
    ]);
    const salaryExpenses = salaries.length > 0 ? salaries[0].totalExpenses : 0;

    const expensesChart = await Promise.all(last6Months.map(async (m) => {
      const mSalaries = await Salary.aggregate([
        { $match: { month: m.month, year: m.year } },
        { $group: { _id: null, total: { $sum: '$netSalary' } } }
      ]);
      return {
        name: m.name,
        expenses: mSalaries.length > 0 ? mSalaries[0].total : 0
      };
    }));

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

    const todayAttendancePercentage = totalTeachers > 0 ? ((presentTeachers / totalTeachers) * 100).toFixed(1) : 0;

    // Aggregations for last 7 days attendance
    const attendanceChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - i);
      const dStart = new Date(d.setHours(0,0,0,0));
      const dEnd = new Date(d.setHours(23,59,59,999));
      
      const count = await Attendance.countDocuments({
        date: { $gte: dStart, $lte: dEnd },
        status: 'present'
      });
      attendanceChart.push({
        day: d.toLocaleString('default', { weekday: 'short' }),
        present: count
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalTeachers,
        salaryExpenses,
        presentTeachers,
        todayAttendancePercentage,
        expensesChart,
        attendanceChart
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

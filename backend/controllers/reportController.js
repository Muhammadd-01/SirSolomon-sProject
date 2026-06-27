import Attendance from '../models/Attendance.js';
import Salary from '../models/Salary.js';


// Very basic implementations for reports, returning raw arrays.
// Excel generation would usually format this using exceljs.

export const getAttendanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, role } = req.query;
    let query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (role) query.role = role;

    const data = await Attendance.find(query).populate('user', 'name');
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getSalaryReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    let query = {};
    if (year) query.year = year;
    if (month) query.month = month;

    const data = await Salary.find(query).populate('teacher', 'fullName department');
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getFinancialReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    
    let salaryQuery = {};
    if (year) salaryQuery.year = year;
    if (month) salaryQuery.month = month;

    const salaries = await Salary.find(salaryQuery);
    const totalExpenses = salaries.reduce((acc, curr) => acc + curr.netSalary, 0);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: 0,
        totalExpenses,
        netProfit: -totalExpenses
      }
    });
  } catch (error) {
    next(error);
  }
};



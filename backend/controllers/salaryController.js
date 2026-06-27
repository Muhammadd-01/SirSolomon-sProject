import Salary from '../models/Salary.js';
import Teacher from '../models/Teacher.js';
import Settings from '../models/Settings.js';
import { generateSalarySlipPDF } from '../utils/generatePDF.js';
import { calculateSalary } from '../utils/calculateSalary.js';
import Attendance from '../models/Attendance.js';
import { SALARY_STATUS } from '../config/constants.js';

// Helper: fetch settings and build custom components list
const getSettingsComponents = async (selectedComponentNames = null) => {
  const settings = await Settings.findOne();
  if (!settings || !settings.salaryComponents || settings.salaryComponents.length === 0) {
    return { components: [], taxPercentage: 0 };
  }

  let components = settings.salaryComponents.map(c => ({
    name: c.name,
    type: c.type,
    amount: c.defaultAmount,
    isPercentage: c.isPercentage
  }));

  // If selectedComponentNames is provided, filter to only those selected
  if (selectedComponentNames && Array.isArray(selectedComponentNames)) {
    components = components.filter(c => selectedComponentNames.includes(c.name));
  }

  return { components, taxPercentage: settings.taxPercentage || 0 };
};

export const generateSalary = async (req, res, next) => {
  try {
    const { teacherId, month, year, advance = 0, bonus = 0, juneSalary = 0, julySalary = 0, selectedComponents } = req.body;

    // Check if already generated
    const existing = await Salary.findOne({ teacher: teacherId, month, year });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Salary already generated for this month' });
    }

    const teacher = await Teacher.findById(teacherId).populate('user');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    // Get actual working days in the month
    const totalWorkingDays = new Date(year, month, 0).getDate();

    // Auto-calculate from attendance records
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await Attendance.find({
      user: teacher.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    let absentCount = 0;
    let lateCount = 0;
    let presentCount = 0;

    attendanceRecords.forEach(record => {
      if (record.status === 'absent') absentCount += 1;
      if (record.status === 'half_day') absentCount += 0.5;
      if (record.status === 'late') lateCount++;
      if (record.status === 'present') presentCount++;
    });

    // Check if teacher qualifies for June/July salary (12+ months of service)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const hasServedOneYear = teacher.joiningDate <= oneYearAgo;

    let finalJuneSalary = Number(juneSalary) || 0;
    let finalJulySalary = Number(julySalary) || 0;
    if (month === 12 && hasServedOneYear && !finalJuneSalary) {
      finalJuneSalary = teacher.basicSalary;
    }
    if (month === 1 && hasServedOneYear && !finalJulySalary) {
      finalJulySalary = teacher.basicSalary;
    }

    // Fetch custom components from settings
    const { components: customComponents, taxPercentage } = await getSettingsComponents(selectedComponents);

    const calculated = calculateSalary({
      basicSalary: teacher.basicSalary,
      totalWorkingDays,
      absences: absentCount,
      lates: lateCount,
      advance: Number(advance) || 0,
      juneSalary: finalJuneSalary,
      julySalary: finalJulySalary,
      bonus: Number(bonus) || 0,
      customComponents,
      taxPercentage
    });

    const salary = await Salary.create({
      teacher: teacherId,
      month,
      year,
      basicSalary: teacher.basicSalary,
      totalWorkingDays,
      perDaySalary: calculated.perDaySalary,
      presentDays: presentCount,
      absentDays: absentCount,
      lateDays: lateCount,
      absenceDeduction: calculated.absenceDeduction,
      absenceDueToLate: calculated.absenceDueToLate,
      lateAbsenceDeduction: calculated.lateAbsenceDeduction,
      advance: Number(advance) || 0,
      totalDeductions: calculated.totalDeductions,
      grossPay: calculated.grossPay,
      attendanceAllowance: calculated.attendanceAllowance,
      punctualityAllowance: calculated.punctualityAllowance,
      customAdditions: calculated.customAdditions,
      customDeductions: calculated.customDeductions,
      appliedComponents: calculated.appliedComponents,
      totalAllowance: calculated.totalAllowance,
      netPay: calculated.netPay,
      taxAmount: calculated.taxAmount,
      juneSalary: finalJuneSalary,
      julySalary: finalJulySalary,
      bonus: Number(bonus) || 0,
      totalAdditions: calculated.totalAdditions,
      payableSalary: calculated.payableSalary,
      generatedBy: req.user._id
    });

    res.status(201).json({ success: true, data: salary });
  } catch (error) {
    next(error);
  }
};

export const previewSalary = async (req, res, next) => {
  try {
    const { teacherId, month, year, advance = 0, bonus = 0, juneSalary = 0, julySalary = 0, selectedComponents } = req.body;

    const teacher = await Teacher.findById(teacherId).populate('user');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    const totalWorkingDays = new Date(year, month, 0).getDate();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await Attendance.find({
      user: teacher.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    let absentCount = 0; let lateCount = 0; let presentCount = 0;
    attendanceRecords.forEach(record => {
      if (record.status === 'absent') absentCount += 1;
      if (record.status === 'half_day') absentCount += 0.5;
      if (record.status === 'late') lateCount++;
      if (record.status === 'present') presentCount++;
    });

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const hasServedOneYear = teacher.joiningDate <= oneYearAgo;

    let finalJuneSalary = Number(juneSalary) || 0;
    let finalJulySalary = Number(julySalary) || 0;
    if (month === 12 && hasServedOneYear && !finalJuneSalary) {
      finalJuneSalary = teacher.basicSalary;
    }
    if (month === 1 && hasServedOneYear && !finalJulySalary) {
      finalJulySalary = teacher.basicSalary;
    }

    // Fetch custom components from settings
    const { components: customComponents, taxPercentage } = await getSettingsComponents(selectedComponents);

    const calculated = calculateSalary({
      basicSalary: teacher.basicSalary,
      totalWorkingDays,
      absences: absentCount,
      lates: lateCount,
      advance: Number(advance) || 0,
      juneSalary: finalJuneSalary,
      julySalary: finalJulySalary,
      bonus: Number(bonus) || 0,
      customComponents,
      taxPercentage
    });

    const preview = {
      teacherName: teacher.fullName,
      joiningDate: teacher.joiningDate,
      department: teacher.department,
      hasServedOneYear,
      basicSalary: teacher.basicSalary,
      totalWorkingDays,
      ...calculated,
      juneSalary: finalJuneSalary,
      julySalary: finalJulySalary,
      bonus: Number(bonus) || 0,
      attendanceStats: { present: presentCount, absent: absentCount, late: lateCount }
    };

    res.status(200).json({ success: true, data: preview });
  } catch (error) {
    next(error);
  }
};

export const getSalaries = async (req, res, next) => {
  try {
    const { month, year, status, teacherId } = req.query;
    let query = {};
    
    if (month) query.month = month;
    if (year) query.year = year;
    if (status) query.status = status;
    if (teacherId) query.teacher = teacherId;

    const salaries = await Salary.find(query).populate('teacher', 'fullName department profileImage');
    res.status(200).json({ success: true, data: salaries });
  } catch (error) {
    next(error);
  }
};

export const updateSalaryStatus = async (req, res, next) => {
  try {
    const { status, transactionId } = req.body;
    
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary not found' });

    salary.status = status;
    if (status === SALARY_STATUS.PAID) {
      salary.paidDate = Date.now();
      if (transactionId) salary.transactionId = transactionId;
    }

    await salary.save();
    res.status(200).json({ success: true, data: salary });
  } catch (error) {
    next(error);
  }
};

export const downloadSalarySlip = async (req, res, next) => {
  try {
    const salary = await Salary.findById(req.params.id).populate({
      path: 'teacher',
      populate: { path: 'user' }
    });
    if (!salary) return res.status(404).json({ success: false, message: 'Salary not found' });

    generateSalarySlipPDF(salary, res);
  } catch (error) {
    next(error);
  }
};

export const deleteSalary = async (req, res, next) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary not found' });
    
    if (salary.status === SALARY_STATUS.PAID) {
      return res.status(400).json({ success: false, message: 'Cannot delete paid salary records' });
    }

    await salary.deleteOne();
    res.status(200).json({ success: true, message: 'Salary record deleted successfully for recalculation' });
  } catch (error) {
    next(error);
  }
};

import Salary from '../models/Salary.js';
import Teacher from '../models/Teacher.js';
import { generateSalarySlipPDF } from '../utils/generatePDF.js';
import { calculateSalary } from '../utils/calculateSalary.js';
import Attendance from '../models/Attendance.js';
import { SALARY_STATUS } from '../config/constants.js';
import Settings from '../models/Settings.js';

export const generateSalary = async (req, res, next) => {
  try {
    const { teacherId, month, year, overtimeHours = 0, leaveDeductions = 0, lateDeductions = 0, advance = 0, vacationPay = 0, enabledComponents } = req.body;

    // Check if already generated
    const existing = await Salary.findOne({ teacher: teacherId, month, year });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Salary already generated for this month' });
    }

    const teacher = await Teacher.findById(teacherId).populate('user');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    // Auto-calculate deductions based on Attendance records for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await Attendance.find({
      user: teacher.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    let absentCount = 0;
    let halfDayCount = 0;
    let lateCount = 0;
    let presentCount = 0;

    attendanceRecords.forEach(record => {
      if (record.status === 'absent') absentCount++;
      if (record.status === 'half_day') halfDayCount++;
      if (record.status === 'late') lateCount++;
      if (record.status === 'present') presentCount++;
    });

    const dailyWage = (teacher.basicSalary || 0) / 30;
    
    // Formula: 1 absent = 1 day wage. 1 half_day = 0.5 day wage. 3 lates = 1 day wage
    const calculatedLeaveDeductions = Math.round(
      (absentCount * dailyWage) + (halfDayCount * (dailyWage * 0.5))
    );
    const calculatedLateDeductions = Math.round(
      Math.floor(lateCount / 3) * dailyWage
    );

    // Allow manual override from req.body, otherwise use calculated
    const finalLeaveDeductions = leaveDeductions || calculatedLeaveDeductions;
    const finalLateDeductions = lateDeductions || calculatedLateDeductions;

    // Read tax from settings
    const settings = await Settings.findOne();
    const taxPercent = settings?.taxPercentage || 0;

    // Custom salary components from settings
    let customAdditions = 0;
    let customDeductions = 0;
    if (settings?.salaryComponents && settings.salaryComponents.length > 0) {
      let compsToApply = settings.salaryComponents;
      if (enabledComponents && Array.isArray(enabledComponents)) {
        compsToApply = compsToApply.filter(c => enabledComponents.includes(c.name));
      }
      compsToApply.forEach(comp => {
        const amount = comp.isPercentage 
          ? (teacher.basicSalary * comp.defaultAmount / 100) 
          : comp.defaultAmount;
        if (comp.type === 'addition') customAdditions += amount;
        else customDeductions += amount;
      });
    }

    // June/July Salary Check (For reference, can be overridden by frontend)
    // If month is 6 or 7, and they haven't served 1 year, they shouldn't get vacation pay
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const hasServedOneYear = teacher.joiningDate <= oneYearAgo;
    
    let finalVacationPay = vacationPay;
    if ((month === 6 || month === 7) && hasServedOneYear && !vacationPay) {
      // Auto assign if it's summer and they qualify, but frontend didn't pass anything
      // Or we just trust the frontend. Let's just trust the frontend `vacationPay` since they might have custom amounts.
    }

    const calculated = calculateSalary({
      basicSalary: teacher.basicSalary,
      allowances: (teacher.allowance || 0) + customAdditions,
      bonuses: teacher.bonus,
      vacationPay: finalVacationPay,
      overtimeHours,
      overtimeRate: teacher.overtimeRate,
      taxPercent,
      leaveDeductions: finalLeaveDeductions,
      lateDeductions: finalLateDeductions,
      advance: advance + customDeductions
    });

    const salary = await Salary.create({
      teacher: teacherId,
      month,
      year,
      basicSalary: teacher.basicSalary,
      allowances: (teacher.allowance || 0) + customAdditions,
      bonuses: teacher.bonus,
      vacationPay: finalVacationPay,
      overtime: {
        hours: overtimeHours,
        rate: teacher.overtimeRate,
        total: calculated.overtimeTotal
      },
      grossSalary: calculated.grossSalary,
      presentDays: presentCount,
      absentDays: absentCount + (halfDayCount * 0.5),
      lateDays: lateCount,
      taxDeduction: calculated.tax,
      leaveDeductions: finalLeaveDeductions,
      lateDeductions: finalLateDeductions,
      advance: advance + customDeductions,
      netSalary: calculated.netSalary,
      generatedBy: req.user._id
    });

    res.status(201).json({ success: true, data: salary });
  } catch (error) {
    next(error);
  }
};

export const previewSalary = async (req, res, next) => {
  try {
    const { teacherId, month, year, overtimeHours = 0, leaveDeductions = 0, lateDeductions = 0, advance = 0, vacationPay = 0, enabledComponents } = req.body;

    const teacher = await Teacher.findById(teacherId).populate('user');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    // Auto-calculate deductions based on Attendance records
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendanceRecords = await Attendance.find({
      user: teacher.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    let absentCount = 0; let halfDayCount = 0; let lateCount = 0; let presentCount = 0;
    attendanceRecords.forEach(record => {
      if (record.status === 'absent') absentCount++;
      if (record.status === 'half_day') halfDayCount++;
      if (record.status === 'late') lateCount++;
      if (record.status === 'present') presentCount++;
    });

    const dailyWage = (teacher.basicSalary || 0) / 30;
    const calculatedLeaveDeductions = Math.round((absentCount * dailyWage) + (halfDayCount * (dailyWage * 0.5)));
    const calculatedLateDeductions = Math.round(Math.floor(lateCount / 3) * dailyWage);

    const finalLeaveDeductions = leaveDeductions || calculatedLeaveDeductions;
    const finalLateDeductions = lateDeductions || calculatedLateDeductions;

    const settings = await Settings.findOne();
    const taxPercent = settings?.taxPercentage || 0;

    let customAdditions = 0; let customDeductions = 0;
    const additionsBreakdown = []; const deductionsBreakdown = [];

    if (settings?.salaryComponents && settings.salaryComponents.length > 0) {
      let compsToApply = settings.salaryComponents;
      if (enabledComponents && Array.isArray(enabledComponents)) {
        compsToApply = compsToApply.filter(c => enabledComponents.includes(c.name));
      }
      compsToApply.forEach(comp => {
        const amount = comp.isPercentage ? (teacher.basicSalary * comp.defaultAmount / 100) : comp.defaultAmount;
        if (comp.type === 'addition') {
          customAdditions += amount;
          additionsBreakdown.push({ name: comp.name, amount });
        } else {
          customDeductions += amount;
          deductionsBreakdown.push({ name: comp.name, amount });
        }
      });
    }

    const calculated = calculateSalary({
      basicSalary: teacher.basicSalary,
      allowances: (teacher.allowance || 0) + customAdditions,
      bonuses: teacher.bonus,
      vacationPay: vacationPay,
      overtimeHours,
      overtimeRate: teacher.overtimeRate,
      taxPercent,
      leaveDeductions: finalLeaveDeductions,
      lateDeductions: finalLateDeductions,
      advance: advance + customDeductions
    });

    const preview = {
      teacherName: teacher.fullName,
      basicSalary: teacher.basicSalary,
      allowances: (teacher.allowance || 0) + customAdditions,
      vacationPay: vacationPay || 0,
      grossSalary: calculated.grossSalary,
      deductions: {
        tax: calculated.tax,
        leave: finalLeaveDeductions,
        late: finalLateDeductions,
        advance: advance + customDeductions
      },
      netSalary: calculated.netSalary,
      additionsBreakdown,
      deductionsBreakdown,
      attendanceStats: { present: presentCount, absent: absentCount, halfDay: halfDayCount, late: lateCount }
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

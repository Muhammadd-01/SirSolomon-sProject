import Attendance from '../models/Attendance.js';
import MonthlyAttendance from '../models/MonthlyAttendance.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';

export const markAttendance = async (req, res, next) => {
  try {
    const { userId, role, date, status, remarks, checkInTime } = req.body;
    
    // Check if attendance already exists for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Remove auto-late detection based on checkInTime for manual operations
    let finalStatus = status;

    let attendance = await Attendance.findOne({
      user: userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (attendance) {
      attendance.status = finalStatus;
      attendance.remarks = remarks;
      attendance.checkInTime = checkInTime || attendance.checkInTime;
      attendance.markedBy = req.user._id;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        user: userId,
        role,
        date: startOfDay,
        status: finalStatus,
        checkInTime: checkInTime || '',
        remarks,
        markedBy: req.user._id
      });
    }

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

export const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { attendances, date, role } = req.body; // attendances: [{userId, status}]
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const operations = attendances.map(record => ({
      updateOne: {
        filter: { user: record.userId, date: startOfDay },
        update: {
          $set: {
            role,
            status: record.status,
            markedBy: req.user._id
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(operations);

    res.status(200).json({ success: true, message: 'Bulk attendance marked successfully' });
  } catch (error) {
    next(error);
  }
};

export const bulkMarkRange = async (req, res, next) => {
  try {
    const { role, startDate, endDate, status, excludeSundays = true, userIds, perUserStatuses } = req.body;

    const operations = [];

    // MODE 1: Per-user per-day calendar grid data
    if (perUserStatuses && Array.isArray(perUserStatuses) && perUserStatuses.length > 0) {
      perUserStatuses.forEach(entry => {
        const dayDate = new Date(entry.date);
        dayDate.setHours(0, 0, 0, 0);
        operations.push({
          updateOne: {
            filter: { user: entry.userId, date: dayDate },
            update: {
              $set: {
                role,
                status: entry.status,
                checkInTime: entry.checkInTime || '',
                markedBy: req.user._id
              }
            },
            upsert: true
          }
        });
      });
    } else {
      // MODE 2: Same status for all selected users across the range
      let activeUsers = [];
      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        activeUsers = userIds;
      } else {
        if (role === 'teacher') {
          const Teacher = (await import('../models/Teacher.js')).default;
          const teachers = await Teacher.find({ status: 'Active' });
          activeUsers = teachers.map(t => t.user);
        }
      }

      if (!activeUsers.length) {
        return res.status(400).json({ success: false, message: `No active ${role}s found` });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (excludeSundays && d.getDay() === 0) continue;
        const currentDay = new Date(d);
        activeUsers.forEach(userId => {
          operations.push({
            updateOne: {
              filter: { user: userId, date: currentDay },
              update: {
                $set: {
                  role,
                  status,
                  markedBy: req.user._id
                }
              },
              upsert: true
            }
          });
        });
      }
    }

    if (operations.length > 0) {
      await Attendance.bulkWrite(operations);
    }

    res.status(200).json({ success: true, message: `Bulk attendance marked successfully for ${operations.length} records.` });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceByDate = async (req, res, next) => {
  try {
    const { date, startDate, endDate, role } = req.query;
    
    let queryStartDate = date ? new Date(date) : new Date(startDate);
    queryStartDate.setHours(0, 0, 0, 0);
    
    let queryEndDate = date ? new Date(date) : new Date(endDate);
    queryEndDate.setHours(23, 59, 59, 999);

    let query = { date: { $gte: queryStartDate, $lte: queryEndDate } };
    if (role) query.role = role;

    const attendances = await Attendance.find(query).populate('user', 'name profileImage');
    res.status(200).json({ success: true, data: attendances });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;

    let query = { user: userId };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendances = await Attendance.find(query).sort({ date: 1 });
    res.status(200).json({ success: true, data: attendances });
  } catch (error) {
    next(error);
  }
};

export const getMonthlySummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year are required' });

    const summaries = await MonthlyAttendance.find({ month, year });
    res.status(200).json({ success: true, data: summaries });
  } catch (error) {
    next(error);
  }
};

export const saveMonthlySummary = async (req, res, next) => {
  try {
    const { month, year, summaries } = req.body; 
    // summaries: [{ user, absentCount, lateCount, halfDayCount }]

    if (!month || !year || !summaries || !Array.isArray(summaries)) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }

    const operations = summaries.map(s => ({
      updateOne: {
        filter: { user: s.user, month, year },
        update: { $set: { absentCount: s.absentCount, lateCount: s.lateCount, halfDayCount: s.halfDayCount, markedBy: req.user._id } },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await MonthlyAttendance.bulkWrite(operations);
    }

    res.status(200).json({ success: true, message: 'Monthly summaries saved successfully' });
  } catch (error) {
    next(error);
  }
};

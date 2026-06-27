import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import Card, { CardBody } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { FiCheckCircle, FiXCircle, FiClock, FiMinusCircle, FiCalendar, FiLayers, FiCalendar as FiCalIcon, FiSave, FiAlertCircle, FiX } from 'react-icons/fi';
import { showSuccess, showError } from '../utils/alerts';
import { motion, AnimatePresence } from 'framer-motion';

const STATUSES = ['present', 'late', 'half_day', 'absent', 'leave'];
const STATUS_COLORS = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  late: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  half_day: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  leave: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  default: 'bg-slate-100 text-slate-700 dark:bg-dark-700 dark:text-slate-300'
};
const STATUS_LABELS = { present: 'P', late: 'L', half_day: 'HD', absent: 'A', leave: 'Lv', default: '-' };

export default function Attendance() {
  const [attendances, setAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [mode, setMode] = useState('daily'); // 'daily' or 'bulk'

  // Daily State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
  const [role, setRole] = useState('teacher');
  const [users, setUsers] = useState([]);

  // Bulk State
  const [bulkData, setBulkData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    excludeSundays: true,
    defaultSignInTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [gridData, setGridData] = useState({}); // { "userId_dateStr": "status" }

  // History Modal State
  const [selectedHistoryUser, setSelectedHistoryUser] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth() + 1);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(role === 'student' ? '/students?status=active' : '/teachers?status=Active');
      setUsers(res.data.data);
    } catch (error) {
      showError(`Failed to load ${role}s`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (mode !== 'daily') return;
    try {
      const res = await api.get(`/attendance/date?date=${date}&role=${role}`);
      setAttendances(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchHistory = async () => {
    if (!selectedHistoryUser) return;
    try {
      setIsHistoryLoading(true);
      const res = await api.get(`/attendance/user/${selectedHistoryUser._id}?month=${historyMonth}&year=${historyYear}`);
      setHistoryData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [role]);
  useEffect(() => { fetchAttendance(); }, [date, role, mode]);
  useEffect(() => { fetchHistory(); }, [selectedHistoryUser, historyMonth, historyYear]);

  useEffect(() => {
    if (mode === 'bulk') {
      setSelectedUsers(users.map(u => u.user || u._id));
    }
  }, [mode, users]);

  const markStatus = async (userId, status) => {
    try {
      const res = await api.post('/attendance/mark', {
        userId, role, date, status, checkInTime
      });
      const finalStatus = res.data?.data?.status;
      if (status === 'present' && finalStatus === 'late') {
        showSuccess(`Marked as LATE (Auto-detected past cutoff)`);
      } else {
        showSuccess(`Marked as ${finalStatus}`);
      }
      fetchAttendance();
    } catch (error) {
      showError('Failed to mark attendance');
    }
  };

  const dateRange = useMemo(() => {
    const dates = [];
    let current = new Date(bulkData.startDate);
    const end = new Date(bulkData.endDate);
    while (current <= end) {
      if (!bulkData.excludeSundays || current.getDay() !== 0) {
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [bulkData.startDate, bulkData.endDate, bulkData.excludeSundays]);

  const toggleGridCell = (userId, dateStr) => {
    const key = `${userId}_${dateStr}`;
    setGridData(prev => {
      const currentStatus = prev[key] || 'default';
      const currentIndex = STATUSES.indexOf(currentStatus);
      const nextStatus = currentIndex === STATUSES.length - 1 ? 'default' : STATUSES[currentIndex + 1];
      return { ...prev, [key]: nextStatus };
    });
  };

  const setAllGridCells = (status) => {
    const newData = {};
    selectedUsers.forEach(userId => {
      dateRange.forEach(d => {
        newData[`${userId}_${d}`] = status;
      });
    });
    setGridData(newData);
  };

  const handleBulkSubmit = async () => {
    if (selectedUsers.length === 0) {
      showError('Please select at least one user');
      return;
    }

    const payload = [];
    selectedUsers.forEach(userId => {
      dateRange.forEach(d => {
        const status = gridData[`${userId}_${d}`];
        if (status && status !== 'default') {
          const timeToPass = (status === 'present' || status === 'late') ? bulkData.defaultSignInTime : '';
          payload.push({ userId, date: d, status, checkInTime: timeToPass });
        }
      });
    });

    if (payload.length === 0) {
      showError('No attendance marked in the grid');
      return;
    }

    try {
      setIsBulkLoading(true);
      await api.post('/attendance/bulk-range', {
        role,
        startDate: bulkData.startDate,
        endDate: bulkData.endDate,
        excludeSundays: bulkData.excludeSundays,
        userIds: selectedUsers,
        perUserStatuses: payload
      });
      showSuccess(`Successfully marked ${payload.length} attendance records`);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to apply bulk attendance');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) setSelectedUsers(users.map(u => u.user || u._id));
    else setSelectedUsers([]);
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) setSelectedUsers(prev => [...prev, userId]);
    else setSelectedUsers(prev => prev.filter(id => id !== userId));
  };

  const tableData = users.map(user => {
    const record = attendances.find(a => a.user?._id === user.user || a.user?._id === user._id);
    return {
      _id: user.user || user._id,
      name: user.fullName || user.name,
      department: user.department || 'N/A',
      status: record?.status || 'Not Marked',
      time: record?.checkInTime || '-'
    };
  });

  const columns = [
    { header: 'Name', key: 'name', render: (row) => (
      <div 
        className="cursor-pointer group"
        onClick={() => setSelectedHistoryUser(row)}
      >
        <p className="font-bold text-slate-900 dark:text-white font-display group-hover:text-primary-600 transition-colors">{row.name}</p>
        <p className="text-xs text-slate-500 group-hover:text-primary-400 transition-colors">Click to view history</p>
      </div>
    )},
    { 
      header: 'Current Status', 
      key: 'status',
      render: (row) => {
        const badgeColor = STATUS_COLORS[row.status] || STATUS_COLORS.default;
        return (
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${badgeColor}`}>{row.status.replace('_', ' ')}</span>
            {row.time !== '-' && <span className="text-xs text-slate-400 font-medium">{row.time}</span>}
          </div>
        );
      }
    },
    { 
      header: 'Mark Attendance', 
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-white/5 w-max">
          <button onClick={() => markStatus(row._id, 'present')} className="px-3 py-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center gap-1" title="Present"><FiCheckCircle /> P</button>
          <button onClick={() => markStatus(row._id, 'late')} className="px-3 py-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors text-sm font-medium flex items-center gap-1" title="Late"><FiClock /> L</button>
          <button onClick={() => markStatus(row._id, 'half_day')} className="px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium flex items-center gap-1" title="Half Day"><FiMinusCircle /> HD</button>
          <button onClick={() => markStatus(row._id, 'absent')} className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-1" title="Absent"><FiXCircle /> A</button>
          <button onClick={() => markStatus(row._id, 'leave')} className="px-3 py-1.5 rounded-lg text-purple-600 hover:bg-purple-100 transition-colors text-sm font-medium flex items-center gap-1" title="Leave"><FiCalendar /> Lv</button>
        </div>
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Attendance Manager</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Mark daily records or apply weekly/monthly bulk attendance</p>
        </div>
        <div className="bg-slate-200 dark:bg-dark-800 p-1 rounded-xl flex gap-1">
          <button className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'daily' ? 'bg-white dark:bg-dark-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} onClick={() => setMode('daily')}><FiCalIcon /> Daily Entry</button>
          <button className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'bulk' ? 'bg-white dark:bg-dark-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} onClick={() => setMode('bulk')}><FiLayers /> Bulk Calendar Grid</button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Target Role</label>
          <select className="input-field !bg-white dark:!bg-dark-800" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="teacher">Teachers</option>
            <option value="student">Students</option>
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'daily' ? (
          <motion.div key="daily" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <Card glass>
              <CardBody className="p-6">
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 dark:bg-dark-800/50 rounded-2xl border border-slate-100 dark:border-white/5 items-end justify-between">
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Select Date</label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full sm:w-48 !bg-white dark:!bg-dark-700" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Sign-In Time</label>
                      <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="w-full sm:w-40 !bg-white dark:!bg-dark-700" />
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                    <FiAlertCircle className="text-amber-500" />
                    Auto-marks LATE if after configured cutoff (e.g. 07:55 AM)
                  </div>
                </div>

                <div className="flex gap-4 text-xs font-medium text-slate-500 mb-4 px-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> P = Present</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> L = Late</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> HD = Half Day</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> A = Absent</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Lv = Leave</span>
                </div>

                <Table columns={columns} data={tableData} isLoading={isLoading} />
              </CardBody>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="bulk" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <Card glass className="border-primary-200 dark:border-primary-900/50">
              <CardBody className="p-6">
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 p-5 bg-slate-50 dark:bg-dark-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                  <Input label="Start Date" type="date" value={bulkData.startDate} onChange={e => setBulkData({...bulkData, startDate: e.target.value})} />
                  <Input label="End Date" type="date" value={bulkData.endDate} onChange={e => setBulkData({...bulkData, endDate: e.target.value})} />
                  <Input label="Default Sign-In Time" type="time" value={bulkData.defaultSignInTime} onChange={e => setBulkData({...bulkData, defaultSignInTime: e.target.value})} />
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 accent-primary-600" checked={bulkData.excludeSundays} onChange={e => setBulkData({...bulkData, excludeSundays: e.target.checked})} />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Exclude Sundays</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display">Calendar Grid</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAllGridCells('present')}>Set All Present</Button>
                    <Button variant="outline" size="sm" onClick={() => setAllGridCells('default')}>Clear Grid</Button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl mb-6">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-700 bg-slate-100 dark:bg-dark-800 dark:text-slate-300 border-b border-slate-200 dark:border-white/5">
                      <tr>
                        <th className="px-4 py-3 min-w-[200px] sticky left-0 z-10 bg-slate-100 dark:bg-dark-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded accent-primary-600" checked={selectedUsers.length === users.length && users.length > 0} onChange={e => handleSelectAll(e.target.checked)} />
                            <span>Select Teacher</span>
                          </label>
                        </th>
                        {dateRange.map(d => (
                          <th key={d} className="px-2 py-3 text-center min-w-[50px] border-l border-slate-200 dark:border-white/5 font-semibold">
                            {new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr><td colSpan={dateRange.length + 1} className="p-8 text-center text-slate-500">No active {role}s found.</td></tr>
                      ) : (
                        users.map((user, i) => {
                          const userId = user.user || user._id;
                          const isSelected = selectedUsers.includes(userId);
                          return (
                            <tr key={userId} className="border-b last:border-b-0 border-slate-100 dark:border-white/5 bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-800/50">
                              <td className="px-4 py-3 sticky left-0 z-10 bg-white dark:bg-dark-900 group-hover:bg-slate-50 dark:group-hover:bg-dark-800/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                <label className="flex items-center gap-2 cursor-pointer w-max">
                                  <input type="checkbox" className="w-4 h-4 rounded accent-primary-600" checked={isSelected} onChange={e => handleSelectUser(userId, e.target.checked)} />
                                  <span className="font-semibold text-slate-800 dark:text-white truncate max-w-[150px]">{user.fullName || user.name}</span>
                                </label>
                              </td>
                              {dateRange.map(d => {
                                const status = gridData[`${userId}_${d}`] || 'default';
                                const colorClass = STATUS_COLORS[status];
                                const label = STATUS_LABELS[status];
                                return (
                                  <td key={`${userId}_${d}`} className="border-l border-slate-100 dark:border-white/5 p-1">
                                    <div 
                                      onClick={() => isSelected && toggleGridCell(userId, d)}
                                      className={`h-10 w-full rounded-md flex items-center justify-center text-xs font-bold cursor-pointer transition-all select-none ${isSelected ? colorClass : 'bg-slate-50 dark:bg-dark-800 text-slate-300 opacity-50 cursor-not-allowed'} ${isSelected && status !== 'default' ? 'shadow-sm border border-black/5' : ''}`}
                                    >
                                      {label}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-900/30">
                  <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
                    Click cells to cycle through statuses: Present(P) → Late(L) → Half Day(HD) → Absent(A) → Leave(Lv) → Unmarked(-)
                  </p>
                  <Button onClick={handleBulkSubmit} isLoading={isBulkLoading} leftIcon={<FiSave />} className="px-8 shadow-lg shadow-primary-500/30">
                    Save Grid Attendance
                  </Button>
                </div>

              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedHistoryUser && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white font-display">
                    {selectedHistoryUser.name}'s Attendance
                  </h2>
                  <p className="text-sm text-slate-500">Day by Day History</p>
                </div>
                <button 
                  onClick={() => setSelectedHistoryUser(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-dark-700 rounded-full transition-colors"
                >
                  <FiX />
                </button>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-dark-900">
                <div className="flex gap-4 mb-6">
                  <select 
                    className="input-field !py-2 text-sm w-32" 
                    value={historyMonth} 
                    onChange={e => setHistoryMonth(Number(e.target.value))}
                  >
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                      <option key={m} value={i+1}>{m}</option>
                    ))}
                  </select>
                  <select 
                    className="input-field !py-2 text-sm w-24" 
                    value={historyYear} 
                    onChange={e => setHistoryYear(Number(e.target.value))}
                  >
                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {isHistoryLoading ? (
                  <div className="py-12 text-center text-primary-500">Loading...</div>
                ) : historyData.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">No attendance records found for this month.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2">
                    {historyData.map(record => {
                      const dateObj = new Date(record.date);
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const dayNum = dateObj.getDate();
                      const colorClass = STATUS_COLORS[record.status] || STATUS_COLORS.default;
                      
                      return (
                        <div key={record._id} className={`p-3 rounded-xl border ${colorClass.replace('bg-', 'border-').replace('text-', '')} bg-opacity-50 flex flex-col justify-between h-20 shadow-sm transition-all hover:-translate-y-0.5`}>
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{dayName}</span>
                            <span className="text-sm font-bold opacity-90">{dayNum}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-xs font-bold capitalize">{record.status.replace('_', ' ')}</span>
                            {record.checkInTime && <span className="text-[9px] font-semibold opacity-70">{record.checkInTime}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

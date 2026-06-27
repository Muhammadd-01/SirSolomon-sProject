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
  const [isDailySaving, setIsDailySaving] = useState(false);
  const [mode, setMode] = useState('daily'); // 'daily' or 'bulk'
  const [editingUserId, setEditingUserId] = useState(null);
  const [pendingDailyChanges, setPendingDailyChanges] = useState({}); // { userId: status }

  // Daily State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
  const [users, setUsers] = useState([]);
  const role = 'teacher'; // Hardcoded since we only manage teachers now

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
      const res = await api.get('/teachers?status=Active');
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
      setPendingDailyChanges({}); // Clear pending changes when date/role changes
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

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchAttendance(); }, [date, mode]);
  useEffect(() => { fetchHistory(); }, [selectedHistoryUser, historyMonth, historyYear]);

  useEffect(() => {
    if (mode === 'bulk') {
      setSelectedUsers(users.map(u => {
        const id = typeof u.user === 'object' ? u.user?._id : u.user;
        return id || u._id;
      }));
    }
  }, [mode, users]);

  // Fetch existing attendance records for the bulk date range and pre-populate gridData
  const fetchBulkExisting = async () => {
    if (mode !== 'bulk' || !bulkData.startDate || !bulkData.endDate || users.length === 0) return;
    try {
      const res = await api.get(`/attendance/date?startDate=${bulkData.startDate}&endDate=${bulkData.endDate}&role=${role}`);
      const records = res.data.data;
      const newGrid = {};
      records.forEach(rec => {
        const userId = rec.user?._id || rec.user;
        const d = new Date(rec.date);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const key = `${userId}_${dateStr}`;
        if (STATUSES.includes(rec.status)) {
          newGrid[key] = rec.status;
        }
      });
      // Server data should overwrite local data when fetching bulk existing
      setGridData(prev => ({ ...prev, ...newGrid }));
    } catch (err) {
      console.error('Failed to fetch bulk existing attendance', err);
    }
  };

  useEffect(() => {
    fetchBulkExisting();
  }, [mode, bulkData.startDate, bulkData.endDate, users]);

  const markStatus = (userId, status) => {
    setPendingDailyChanges(prev => ({
      ...prev,
      [userId]: status
    }));
  };

  const saveDailyChanges = async () => {
    const userIdsWithChanges = Object.keys(pendingDailyChanges);
    if (userIdsWithChanges.length === 0) return;

    const payload = userIdsWithChanges.map(userId => {
      const status = pendingDailyChanges[userId];
      const timeToPass = (status === 'present' || status === 'late') ? checkInTime : '';
      return { userId, date, status, checkInTime: timeToPass };
    });

    try {
      setIsDailySaving(true);
      await api.post('/attendance/bulk-range', {
        role,
        startDate: date,
        endDate: date,
        excludeSundays: false,
        userIds: userIdsWithChanges,
        perUserStatuses: payload
      });
      showSuccess(`Successfully saved daily attendance`);
      fetchAttendance();
    } catch (error) {
      showError('Failed to save attendance changes');
    } finally {
      setIsDailySaving(false);
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
    const actualUserId = typeof user.user === 'object' ? user.user?._id : user.user;
    const finalId = actualUserId || user._id;
    const record = attendances.find(a => a.user?._id === finalId || a.user === finalId);
    
    // If there is a pending change for this user, reflect that instead of the DB record
    const currentStatus = pendingDailyChanges[finalId] || record?.status || 'Not Marked';
    
    return {
      _id: finalId,
      name: user.fullName || user.name,
      department: user.department || 'N/A',
      status: currentStatus,
      isPending: !!pendingDailyChanges[finalId],
      time: pendingDailyChanges[finalId] && ['present', 'late'].includes(currentStatus) ? checkInTime : (record?.checkInTime || '-')
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
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${badgeColor} ${row.isPending ? 'border border-primary-400 border-dashed animate-pulse' : ''}`}>{row.status.replace('_', ' ')} {row.isPending && '(Unsaved)'}</span>
            {row.time !== '-' && <span className="text-xs text-slate-400 font-medium">{row.time}</span>}
          </div>
        );
      }
    },
    { 
      header: 'Mark Attendance', 
      key: 'actions',
      render: (row) => {
        if (row.status !== 'Not Marked' && !row.isPending && editingUserId !== row._id) {
          return (
            <div className="flex items-center gap-3 py-1">
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <FiCheckCircle className="w-4 h-4" /> Saved
              </span>
              <button 
                onClick={() => setEditingUserId(row._id)} 
                className="text-xs text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors underline"
              >
                Edit
              </button>
            </div>
          );
        }

        const currentStatus = row.status !== 'Not Marked' ? row.status : null;
        const activeRing = (s) => currentStatus === s ? 'ring-2 ring-offset-1' : '';
        return (
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-white/5 w-max">
            <button onClick={() => { markStatus(row._id, 'present'); setEditingUserId(null); }} className={`px-3 py-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center gap-1 ${activeRing('present')} ${currentStatus === 'present' ? 'bg-emerald-100 dark:bg-emerald-500/20 ring-emerald-500' : ''}`} title="Present"><FiCheckCircle /> P</button>
            <button onClick={() => { markStatus(row._id, 'late'); setEditingUserId(null); }} className={`px-3 py-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors text-sm font-medium flex items-center gap-1 ${activeRing('late')} ${currentStatus === 'late' ? 'bg-amber-100 dark:bg-amber-500/20 ring-amber-500' : ''}`} title="Late"><FiClock /> L</button>
            <button onClick={() => { markStatus(row._id, 'half_day'); setEditingUserId(null); }} className={`px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium flex items-center gap-1 ${activeRing('half_day')} ${currentStatus === 'half_day' ? 'bg-blue-100 dark:bg-blue-500/20 ring-blue-500' : ''}`} title="Half Day"><FiMinusCircle /> HD</button>
            <button onClick={() => { markStatus(row._id, 'absent'); setEditingUserId(null); }} className={`px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-1 ${activeRing('absent')} ${currentStatus === 'absent' ? 'bg-red-100 dark:bg-red-500/20 ring-red-500' : ''}`} title="Absent"><FiXCircle /> A</button>
            <button onClick={() => { markStatus(row._id, 'leave'); setEditingUserId(null); }} className={`px-3 py-1.5 rounded-lg text-purple-600 hover:bg-purple-100 transition-colors text-sm font-medium flex items-center gap-1 ${activeRing('leave')} ${currentStatus === 'leave' ? 'bg-purple-100 dark:bg-purple-500/20 ring-purple-500' : ''}`} title="Leave"><FiCalendar /> Lv</button>
            {row.status !== 'Not Marked' && !row.isPending && (
              <button onClick={() => setEditingUserId(null)} className="px-2 py-1.5 text-slate-400 hover:text-slate-600"><FiX /></button>
            )}
            {row.isPending && (
              <button onClick={() => { setPendingDailyChanges(prev => { const n = {...prev}; delete n[row._id]; return n; }); setEditingUserId(null); }} className="px-2 py-1.5 text-slate-400 hover:text-red-500 text-xs font-bold transition-colors">Undo</button>
            )}
          </div>
        );
      }
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



      <AnimatePresence mode="wait">
        {mode === 'daily' ? (
          <motion.div key="daily" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
            <Card glass>
              <CardBody className="p-6">
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 dark:bg-dark-800/50 rounded-2xl border border-slate-100 dark:border-white/5 items-end justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Select Date</label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full sm:w-48 !bg-white dark:!bg-dark-700" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Sign-In Time</label>
                      <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="w-full sm:w-40 !bg-white dark:!bg-dark-700" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4 px-2">
                  <div className="flex gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> P = Present</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> L = Late</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> HD = Half Day</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> A = Absent</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Lv = Leave</span>
                  </div>

                  <AnimatePresence>
                    {Object.keys(pendingDailyChanges).length > 0 && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <Button onClick={saveDailyChanges} isLoading={isDailySaving} leftIcon={<FiSave />} size="sm" className="shadow-lg shadow-primary-500/20 px-6">
                          Save {Object.keys(pendingDailyChanges).length} Change{Object.keys(pendingDailyChanges).length > 1 ? 's' : ''}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                          const rawUserId = typeof user.user === 'object' ? user.user?._id : user.user;
                          const userId = rawUserId || user._id;
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
                ) : (
                  <div className="w-full">
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {(() => {
                        const daysInMonth = new Date(historyYear, historyMonth, 0).getDate();
                        const firstDay = new Date(historyYear, historyMonth - 1, 1).getDay(); // 0 is Sunday
                        
                        const calendarDays = [];
                        for(let i=0; i<firstDay; i++) calendarDays.push(null);
                        for(let i=1; i<=daysInMonth; i++) calendarDays.push(i);

                        return calendarDays.map((day, index) => {
                          if (!day) return <div key={`empty-${index}`} className="h-16 rounded-xl bg-slate-100/50 dark:bg-dark-900/50"></div>;
                          
                          const record = historyData.find(r => {
                            const d = new Date(r.date);
                            return d.getDate() === day && d.getMonth() + 1 === historyMonth && d.getFullYear() === historyYear;
                          });

                          const colorClass = record ? (STATUS_COLORS[record.status] || STATUS_COLORS.default) : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-white/10 text-slate-400';
                          const label = record ? STATUS_LABELS[record.status] : '-';
                          const bgOp = record ? 'bg-opacity-20 dark:bg-opacity-20' : '';

                          return (
                            <div key={day} className={`relative flex flex-col items-center justify-center h-16 rounded-xl border ${record ? colorClass.replace('bg-', 'border-').replace('text-', '') + ' ' + bgOp : ''} shadow-sm transition-all hover:scale-105`}>
                              <span className="absolute top-1 left-2 text-[10px] font-bold opacity-50">{day}</span>
                              <span className={`text-lg font-bold ${record ? colorClass.split(' ').find(c => c.startsWith('text-')) || '' : ''}`}>{label}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
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

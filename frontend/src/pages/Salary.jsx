import { useState, useEffect } from 'react';
import api from '../services/api';
import Card, { CardBody } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { FiDollarSign, FiDownload, FiFileText, FiCheckSquare, FiSquare, FiUser, FiFilter, FiZap, FiTrash2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { showSuccess, showError } from '../utils/alerts';
import { formatCurrency } from '../utils/formatters';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function Salary() {
  const [salaries, setSalaries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [enabledComponents, setEnabledComponents] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [teacherFilter, setTeacherFilter] = useState('Active');
  const [selectedTeachers, setSelectedTeachers] = useState([]);

  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    advance: 0,
    vacationPay: 0,
  });

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const fetchSalaries = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/salary?month=${formData.month}&year=${formData.year}`);
      setSalaries(res.data.data);
    } catch (error) {
      showError('Failed to load salaries');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      let url = '/teachers';
      if (teacherFilter !== 'All') {
        url += `?status=${teacherFilter}`;
      }
      const res = await api.get(url);
      setTeachers(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.data) {
        setSettings(res.data.data);
        // By default, enable all components
        setEnabledComponents((res.data.data.salaryComponents || []).map(c => c.name));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchSalaries(); }, [formData.month, formData.year]);
  useEffect(() => { fetchTeachers(); }, [teacherFilter]);
  useEffect(() => { fetchSettings(); }, []);

  // Check if a teacher already has salary generated
  const isGenerated = (teacherId) => salaries.some(s => s.teacher?._id === teacherId);
  const ungeneratedSelected = selectedTeachers.filter(id => !isGenerated(id));
  const allUngenerated = teachers.filter(t => !isGenerated(t._id));

  const fetchPreview = async () => {
    if (ungeneratedSelected.length === 0) {
      setPreviewData(null);
      return;
    }
    try {
      setIsLoadingPreview(true);
      const tId = ungeneratedSelected[0]; // Preview the first selected
      const res = await api.post('/salary/preview', {
        teacherId: tId,
        month: formData.month,
        year: formData.year,
        advance: formData.advance,
        vacationPay: formData.vacationPay,
        enabledComponents
      });
      setPreviewData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => { fetchPreview(); }, [selectedTeachers, enabledComponents, formData]);

  // Toggle single teacher
  const toggleTeacher = (id) => {
    if (isGenerated(id)) return; // can't uncheck already generated
    setSelectedTeachers(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // Select all unchecked teachers
  const toggleSelectAll = () => {
    const ungenerated = teachers.filter(t => !isGenerated(t._id)).map(t => t._id);
    if (ungenerated.every(id => selectedTeachers.includes(id))) {
      // Deselect all
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(ungenerated);
    }
  };

  // Calculate salaries for all selected teachers
  const handleCalculateSelected = async () => {
    if (selectedTeachers.length === 0) {
      showError('Please select at least one teacher first.');
      return;
    }

    try {
      setIsGenerating(true);
      let successCount = 0;
      let errorCount = 0;

      for (const tId of selectedTeachers) {
        try {
          const teacher = teachers.find(t => t._id === tId);
          let autoVacationPay = formData.vacationPay;
          
          if (!autoVacationPay && (formData.month === 6 || formData.month === 7)) {
            const joiningDate = new Date(teacher.joiningDate);
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            if (joiningDate <= oneYearAgo) {
              autoVacationPay = teacher.basicSalary;
            }
          }

          await api.post('/salary', {
            teacherId: tId,
            month: formData.month,
            year: formData.year,
            advance: formData.advance,
            vacationPay: autoVacationPay,
            enabledComponents
          });
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        showSuccess(`✅ Calculated salaries for ${successCount} teacher${successCount > 1 ? 's' : ''}!`);
      }
      if (errorCount > 0) {
        showError(`${errorCount} already generated or failed.`);
      }
      
      setSelectedTeachers([]);
      fetchSalaries();
    } catch (error) {
      showError('Failed to generate salaries');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary record? This will allow you to recalculate it.')) return;
    try {
      await api.delete(`/salary/${id}`);
      showSuccess('Salary record deleted');
      fetchSalaries();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete record');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/salary/${id}/status`, { status });
      showSuccess('Status updated');
      fetchSalaries();
    } catch (error) {
      showError('Failed to update status');
    }
  };

  const exportToExcel = () => {
    if (salaries.length === 0) { showError('No data to export'); return; }
    const worksheetData = salaries.map((s, i) => ({
      '#': i + 1,
      'Teacher': s.teacher?.fullName || 'N/A',
      'Basic': s.basicSalary,
      'Allowances': s.allowances,
      'Bonuses': s.bonuses,
      'Vacation': s.vacationPay || 0,
      'Gross': s.grossSalary,
      'Tax': s.taxDeduction,
      'Leave Ded.': s.leaveDeductions,
      'Late Ded.': s.lateDeductions,
      'Advance': s.advance || 0,
      'Net Salary': s.netSalary,
      'Status': s.status?.toUpperCase(),
    }));
    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salary');
    XLSX.writeFile(wb, `Salary_${monthNames[formData.month - 1]}_${formData.year}.xlsx`);
    showSuccess('Excel downloaded!');
  };

  const sendWhatsApp = (row) => {
    const t = row.teacher;
    const phone = t?.phone?.replace(/[^0-9]/g, '') || '';
    const msg = encodeURIComponent(
      `Hello ${t?.fullName},\n\nYour salary for *${monthNames[formData.month - 1]} ${formData.year}*:\n\n` +
      `💰 Gross: PKR ${row.grossSalary?.toLocaleString()}\n` +
      `📉 Deductions: PKR ${((row.taxDeduction||0) + (row.leaveDeductions||0) + (row.lateDeductions||0) + (row.advance||0)).toLocaleString()}\n` +
      `✅ *Net: PKR ${row.netSalary?.toLocaleString()}*\n\nRegards, Sir Solomon's`
    );
    window.open(phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const downloadSlip = (id) => {
    window.open(`http://localhost:5000/api/salary/${id}/slip`, '_blank');
  };

  const columns = [
    { header: 'Teacher', key: 'teacher', render: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-xs">
          {r.teacher?.profileImage ? <img src={`http://localhost:5000${r.teacher.profileImage}`} className="w-full h-full object-cover" /> : <FiUser />}
        </div>
        <span className="font-semibold text-slate-900 dark:text-white font-display">{r.teacher?.fullName}</span>
      </div>
    )},
    { header: 'Gross', key: 'grossSalary', render: (r) => formatCurrency(r.grossSalary) },
    { header: 'Deductions', key: 'deductions', render: (r) => (
      <span className="text-red-500 text-sm">{formatCurrency((r.taxDeduction||0)+(r.leaveDeductions||0)+(r.lateDeductions||0)+(r.advance||0))}</span>
    )},
    { header: 'Net Salary', key: 'netSalary', render: (r) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(r.netSalary)}</span> },
    { header: 'Status', key: 'status', render: (r) => (
      <select 
        className={`px-2 py-1 rounded-lg text-xs font-medium outline-none cursor-pointer ${r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : r.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
        value={r.status} onChange={(e) => handleStatusChange(r._id, e.target.value)}
      >
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="paid">Paid</option>
      </select>
    )},
    { header: '', key: 'actions', render: (r) => (
      <div className="flex items-center gap-1">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => downloadSlip(r._id)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors dark:hover:bg-primary-500/10" title="PDF">
          <FiDownload className="w-3.5 h-3.5" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => sendWhatsApp(r)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors dark:hover:bg-green-500/10" title="WhatsApp">
          <FaWhatsapp className="w-3.5 h-3.5" />
        </motion.button>
        {r.status !== 'paid' && (
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDelete(r._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10" title="Recalculate (Delete)">
            <FiTrash2 className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
    )}
  ];

  // Variables moved up for preview functionality

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Salary Generation</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Select teachers → Click Calculate → Salaries auto-computed from attendance records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Teacher Checklist */}
        <div className="lg:col-span-1">
          <Card glass className="border-primary-200 dark:border-primary-900/50 shadow-primary-500/5">
            <CardBody className="p-5">
              <div className="flex items-center gap-2 mb-4 text-primary-600 dark:text-primary-400 border-b border-primary-100 dark:border-primary-900/30 pb-3">
                <FiDollarSign className="w-5 h-5" />
                <h3 className="font-bold font-display text-sm">Salary Calculator</h3>
              </div>

              {/* Month / Year */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Month</label>
                  <select className="input-field text-sm !py-1.5" value={formData.month} onChange={(e) => setFormData({...formData, month: Number(e.target.value)})}>
                    {monthNames.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Year</label>
                  <select className="input-field text-sm !py-1.5" value={formData.year} onChange={(e) => setFormData({...formData, year: Number(e.target.value)})}>
                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Teacher List Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teachers</label>
                  <span className="text-[10px] bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded-full font-bold">
                    {selectedTeachers.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Filter */}
                  <div className="flex items-center gap-1 bg-white dark:bg-dark-700 border border-slate-200 dark:border-slate-600 rounded-md px-1 py-0.5">
                    <FiFilter className="w-3 h-3 text-slate-400" />
                    <select className="text-[11px] bg-transparent outline-none text-slate-600 dark:text-slate-300 font-medium cursor-pointer" value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Left">Left</option>
                      <option value="All">All</option>
                    </select>
                  </div>
                  {/* Select All */}
                  <button type="button" onClick={toggleSelectAll} className="text-[10px] font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 uppercase tracking-wider whitespace-nowrap">
                    {allUngenerated.length > 0 && allUngenerated.every(t => selectedTeachers.includes(t._id)) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              
              {/* Checklist */}
              <div className="h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/50 bg-white/50 dark:bg-dark-800 mb-4">
                {teachers.length === 0 && (
                  <div className="text-center p-4 text-slate-400 text-sm">No teachers found.</div>
                )}
                {teachers.map(t => {
                  const generated = isGenerated(t._id);
                  const selected = selectedTeachers.includes(t._id);
                  
                  return (
                    <div 
                      key={t._id} 
                      onClick={() => toggleTeacher(t._id)}
                      className={`flex items-center gap-3 p-2.5 transition-all duration-150 ${
                        generated 
                          ? 'bg-emerald-50/80 dark:bg-emerald-900/10 cursor-default' 
                          : selected
                            ? 'bg-primary-50 dark:bg-primary-500/10 cursor-pointer'
                            : 'hover:bg-slate-50 dark:hover:bg-dark-700 cursor-pointer'
                      }`}
                    >
                      <div className={`text-lg flex-shrink-0 ${
                        generated ? 'text-emerald-500' : selected ? 'text-primary-500' : 'text-slate-300 dark:text-slate-600'
                      }`}>
                        {generated || selected ? <FiCheckSquare /> : <FiSquare />}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] flex-shrink-0">
                        {t.profileImage ? <img src={`http://localhost:5000${t.profileImage}`} className="w-full h-full object-cover" /> : <FiUser />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">{t.fullName}</p>
                        <p className="text-[10px] text-slate-400">{t.department || 'General'} · PKR {(t.basicSalary || 0).toLocaleString()}</p>
                      </div>
                      {generated && (
                        <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full flex-shrink-0">DONE</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Optional Overrides */}
              <div className="space-y-3 mb-4">
                <Input label="Advance Deduction (PKR)" type="number" placeholder="0" value={formData.advance || ''} onChange={(e) => setFormData({...formData, advance: Number(e.target.value)})} />
                <Input label="Vacation Pay Override (PKR)" type="number" placeholder="Auto for Jun/Jul" value={formData.vacationPay || ''} onChange={(e) => setFormData({...formData, vacationPay: Number(e.target.value)})} />
                
                {/* Custom Allowances Checkboxes */}
                {settings?.salaryComponents?.length > 0 && (
                  <div className="pt-3 mt-2 border-t border-slate-100 dark:border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Apply Settings Allowances</label>
                      <button type="button" onClick={() => setEnabledComponents(
                        enabledComponents.length === settings.salaryComponents.length 
                          ? [] 
                          : settings.salaryComponents.map(c => c.name)
                      )} className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase">
                        {enabledComponents.length === settings?.salaryComponents?.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {settings.salaryComponents.map(comp => (
                        <label key={comp.name} className="flex items-center gap-3 cursor-pointer bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors p-2.5 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 accent-primary-600" 
                            checked={enabledComponents.includes(comp.name)}
                            onChange={(e) => {
                              if (e.target.checked) setEnabledComponents(prev => [...prev, comp.name]);
                              else setEnabledComponents(prev => prev.filter(n => n !== comp.name));
                            }}
                          />
                          <div className="flex-1 flex justify-between items-center text-sm min-w-0">
                            <span className="font-semibold text-slate-700 dark:text-slate-200 truncate pr-2">{comp.name}</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${comp.type === 'addition' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                              {comp.type === 'addition' ? '+' : '-'}{comp.defaultAmount}{comp.isPercentage ? '%' : ' PKR'}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Calculate Button */}
              <AnimatePresence>
                {ungeneratedSelected.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button 
                      onClick={handleCalculateSelected} 
                      isLoading={isGenerating} 
                      leftIcon={<FiZap />}
                      className="w-full shadow-lg shadow-primary-500/30 !bg-gradient-to-r !from-primary-600 !to-emerald-500 hover:!from-primary-700 hover:!to-emerald-600 text-white font-bold"
                    >
                      Calculate {ungeneratedSelected.length} Salary{ungeneratedSelected.length > 1 ? 'ies' : ''}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {ungeneratedSelected.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-2">
                  {teachers.length > 0 ? '☝️ Check teachers above to enable the button' : 'No teachers to calculate'}
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Records Table & Preview */}
        <div className="lg:col-span-2 space-y-6">
          {previewData && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <Card glass className="border-blue-200 dark:border-blue-900/50 shadow-blue-500/5 bg-gradient-to-br from-white to-blue-50/50 dark:from-dark-800 dark:to-blue-900/10">
                <CardBody className="p-5">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-100 dark:border-white/5">
                    <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 font-display flex items-center gap-2">
                      <FiDollarSign /> Live Calculation Preview
                    </h3>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">For: {previewData.teacherName}</span>
                  </div>
                  {isLoadingPreview ? (
                    <div className="py-8 text-center text-blue-500"><FiZap className="w-6 h-6 animate-pulse mx-auto" /></div>
                  ) : (
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-slate-500">Basic Salary</span><span className="font-semibold">{formatCurrency(previewData.basicSalary)}</span></div>
                        {previewData.additionsBreakdown?.map(a => (
                          <div key={a.name} className="flex justify-between text-emerald-600"><span className="text-emerald-500/70 text-xs">+ {a.name}</span><span className="font-semibold">{formatCurrency(a.amount)}</span></div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/5"><span className="font-bold text-slate-700 dark:text-slate-300">Gross Salary</span><span className="font-bold text-slate-800 dark:text-white">{formatCurrency(previewData.grossSalary)}</span></div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-red-500"><span className="text-red-400/70 text-xs">- Late ({previewData.attendanceStats.late} days)</span><span className="font-semibold">{formatCurrency(previewData.deductions.late)}</span></div>
                        <div className="flex justify-between text-red-500"><span className="text-red-400/70 text-xs">- Leave/Absent ({previewData.attendanceStats.absent} days)</span><span className="font-semibold">{formatCurrency(previewData.deductions.leave)}</span></div>
                        {previewData.deductionsBreakdown?.map(d => (
                          <div key={d.name} className="flex justify-between text-red-500"><span className="text-red-400/70 text-xs">- {d.name}</span><span className="font-semibold">{formatCurrency(d.amount)}</span></div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/5"><span className="font-bold text-slate-700 dark:text-slate-300">Total Deductions</span><span className="font-bold text-red-600">{formatCurrency(previewData.deductions.tax + previewData.deductions.late + previewData.deductions.leave + previewData.deductions.advance)}</span></div>
                      </div>
                      <div className="col-span-2 bg-blue-100/50 dark:bg-blue-900/20 p-3 rounded-lg flex justify-between items-center mt-2 border border-blue-200 dark:border-blue-800/50">
                        <span className="font-bold text-blue-900 dark:text-blue-100 text-lg uppercase tracking-wide">Net Salary</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-xl">{formatCurrency(previewData.netSalary)}</span>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          )}

          <Card glass className="h-full">
            <CardBody className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display">Salary Records</h3>
                  <p className="text-sm text-slate-500">{monthNames[formData.month - 1]} {formData.year} · {salaries.length} record{salaries.length !== 1 ? 's' : ''}</p>
                </div>
                <Button variant="secondary" size="sm" leftIcon={<FiFileText />} onClick={exportToExcel}>
                  Export
                </Button>
              </div>
              
              <div className="flex-1">
                {salaries.length === 0 && !isLoading ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-dark-800 flex items-center justify-center mx-auto mb-4">
                      <FiDollarSign className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No salaries generated yet</p>
                    <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">Check the teachers on the left panel and click the Calculate button to generate their monthly salary.</p>
                  </div>
                ) : (
                  <Table columns={columns} data={salaries} isLoading={isLoading} />
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

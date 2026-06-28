import { useState, useEffect } from 'react';
import api from '../services/api';
import Card, { CardBody } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { FiDollarSign, FiDownload, FiFileText, FiCheckSquare, FiSquare, FiUser, FiFilter, FiZap, FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { showSuccess, showError, confirmDelete } from '../utils/alerts';
import { formatCurrency } from '../utils/formatters';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function Salary() {
  const [salaries, setSalaries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [teacherFilter, setTeacherFilter] = useState('Active');
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedSalaryIds, setSelectedSalaryIds] = useState([]);

  // Salary components from settings
  const [salaryComponents, setSalaryComponents] = useState([]);
  // Per-teacher component overrides: { teacherId: [compName1, compName2, ...] }
  const [teacherComponents, setTeacherComponents] = useState({});
  // Which teacher's components are expanded
  const [expandedTeacher, setExpandedTeacher] = useState(null);
  
  const [teacherAdvances, setTeacherAdvances] = useState({});
  const [advanceInput, setAdvanceInput] = useState({ teacherId: '', amount: '' });

  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    advance: 0,
    bonus: 0,
    juneSalary: 0,
    julySalary: 0,
  });

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const fetchSalaries = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/salary?month=${formData.month}&year=${formData.year}`);
      setSalaries(res.data.data);
      setSelectedSalaryIds([]);
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
      if (res.data?.data?.salaryComponents) {
        setSalaryComponents(res.data.data.salaryComponents);
      }
    } catch (err) {
      console.error('Failed to load settings components', err);
    }
  };

  useEffect(() => { fetchSalaries(); }, [formData.month, formData.year]);
  useEffect(() => { fetchTeachers(); }, [teacherFilter]);
  useEffect(() => { fetchSettings(); }, []);

  // When teachers or components load, default all components ON for every teacher
  useEffect(() => {
    if (teachers.length > 0 && salaryComponents.length > 0) {
      const allNames = salaryComponents.map(c => c.name);
      setTeacherComponents(prev => {
        const updated = { ...prev };
        teachers.forEach(t => {
          if (!updated[t._id]) {
            updated[t._id] = [...allNames]; // all selected by default
          }
        });
        return updated;
      });
    }
  }, [teachers, salaryComponents]);

  const isGenerated = (teacherId) => salaries.some(s => s.teacher?._id === teacherId);
  const ungeneratedSelected = selectedTeachers.filter(id => !isGenerated(id));
  const allUngenerated = teachers.filter(t => !isGenerated(t._id));

  const getSelectedComponentsForTeacher = (teacherId) => {
    return teacherComponents[teacherId] || salaryComponents.map(c => c.name);
  };

  const toggleComponentForTeacher = (teacherId, compName) => {
    setTeacherComponents(prev => {
      const current = prev[teacherId] || salaryComponents.map(c => c.name);
      const updated = current.includes(compName)
        ? current.filter(n => n !== compName)
        : [...current, compName];
      return { ...prev, [teacherId]: updated };
    });
  };

  const fetchPreview = async () => {
    if (ungeneratedSelected.length === 0) {
      setPreviewData([]);
      return;
    }
    try {
      setIsLoadingPreview(true);
      
      const promises = ungeneratedSelected.map(tId => 
        api.post('/salary/preview', {
          teacherId: tId,
          month: formData.month,
          year: formData.year,
          advance: teacherAdvances[tId] || 0,
          bonus: formData.bonus,
          juneSalary: formData.juneSalary,
          julySalary: formData.julySalary,
          selectedComponents: getSelectedComponentsForTeacher(tId),
        })
      );

      const responses = await Promise.all([...promises, new Promise(resolve => setTimeout(resolve, 600))]);
      
      const previewResults = responses.slice(0, -1).map(res => res.data.data);
      setPreviewData(previewResults);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => { fetchPreview(); }, [selectedTeachers, formData, teacherComponents, teacherAdvances]);

  const toggleTeacher = (id) => {
    if (isGenerated(id)) return;
    setSelectedTeachers(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const ungenerated = teachers.filter(t => !isGenerated(t._id)).map(t => t._id);
    if (ungenerated.every(id => selectedTeachers.includes(id))) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(ungenerated);
    }
  };

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
          await api.post('/salary', {
            teacherId: tId,
            month: formData.month,
            year: formData.year,
            advance: teacherAdvances[tId] || 0,
            bonus: formData.bonus,
            juneSalary: formData.juneSalary,
            julySalary: formData.julySalary,
            selectedComponents: getSelectedComponentsForTeacher(tId),
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
    const confirmed = await confirmDelete('this salary record');
    if (!confirmed) return;
    try {
      await api.delete(`/salary/${id}`);
      showSuccess('Salary record deleted');
      fetchSalaries();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete record');
    }
  };

  const toggleSelectSalary = (id) => {
    setSelectedSalaryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAllSalaries = () => {
    // Only select salaries that are not PAID, as PAID cannot be deleted (based on backend logic, but we can just select all and let backend skip, but better UI to check here too if needed. Actually backend handles skipping. Let's just select all)
    if (selectedSalaryIds.length === salaries.length) {
      setSelectedSalaryIds([]);
    } else {
      setSelectedSalaryIds(salaries.map(s => s._id));
    }
  };

  const handleBulkDeleteSalaries = async () => {
    const isConfirmed = await confirmDelete(`${selectedSalaryIds.length} salary record(s)`);
    if (!isConfirmed) return;
    try {
      const res = await api.post('/salary/bulk-delete', { ids: selectedSalaryIds });
      showSuccess(res.data.message);
      setSelectedSalaryIds([]);
      fetchSalaries();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to bulk delete salaries');
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

  const exportToExcel = async () => {
    if (salaries.length === 0) { showError('No data to export'); return; }
    try {
      const response = await api.get(`/salary/bulk/excel?month=${formData.month}&year=${formData.year}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Salaries-${monthNames[formData.month - 1]}-${formData.year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess('Excel downloaded and saved to Project Root/Excel_Reports!');
    } catch (error) {
      showError('Failed to generate Excel report');
    }
  };

  const downloadAllPDF = async () => {
    if (salaries.length === 0) { showError('No salaries to download'); return; }
    try {
      const response = await api.get(`/salary/bulk/pdf?month=${formData.month}&year=${formData.year}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `All-Salary-Slips-${monthNames[formData.month - 1]}-${formData.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('All salary slips downloaded as PDF!');
    } catch (error) {
      showError('Failed to download bulk PDF');
    }
  };

  const downloadExcelFromServer = async () => {
    if (salaries.length === 0) { showError('No salaries to download'); return; }
    try {
      const response = await api.get(`/salary/bulk/excel?month=${formData.month}&year=${formData.year}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Salaries-${monthNames[formData.month - 1]}-${formData.year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('Excel downloaded & saved on server!');
    } catch (error) {
      showError('Failed to download Excel');
    }
  };

  const sendWhatsApp = (row) => {
    // Open WhatsApp immediately (avoids popup blockers)
    const t = row.teacher;
    let phone = t?.phone?.replace(/[^0-9]/g, '') || '';
    if (phone.startsWith('03') && phone.length === 11) {
      phone = '92' + phone.substring(1);
    }
    const msg = encodeURIComponent(
      `Hello ${t?.fullName},\n\nYour salary for *${monthNames[formData.month - 1]} ${formData.year}*:\n\n` +
      `💰 Gross Pay: PKR ${row.grossPay?.toLocaleString()}\n` +
      `✅ Allowances: PKR ${row.totalAllowance?.toLocaleString()}\n` +
      `➕ Additions: PKR ${row.totalAdditions?.toLocaleString()}\n` +
      `✅ *Final Payable: PKR ${row.payableSalary?.toLocaleString()}*\n\nPlease find your detailed salary slip attached.\n\nRegards, Sir Solomon's`
    );
    // Use wa.me for more direct opening
    window.open(phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank');

    // Trigger download in current window after a short delay so it doesn't interrupt the new tab
    setTimeout(() => {
      window.location.href = `http://localhost:5001/api/salary/${row._id}/slip`;
    }, 1000);
  };

  const downloadSlip = (id) => {
    window.open(`http://localhost:5001/api/salary/${id}/slip`, '_blank');
  };

  const columns = [
    { 
      header: (
        <button onClick={toggleSelectAllSalaries} className="text-lg flex items-center justify-center p-1">
          {selectedSalaryIds.length > 0 && selectedSalaryIds.length === salaries.length ? 
            <FiCheckSquare className="text-primary-500" /> : 
            <FiSquare className="text-slate-400" />
          }
        </button>
      ), 
      key: 'select', 
      render: (r) => {
        const isSelected = selectedSalaryIds.includes(r._id);
        return (
          <button onClick={() => toggleSelectSalary(r._id)} className="text-lg flex items-center justify-center p-1">
            {isSelected ? <FiCheckSquare className="text-primary-500" /> : <FiSquare className="text-slate-300 dark:text-slate-600 hover:text-slate-400" />}
          </button>
        );
      }
    },
    { header: 'Teacher', key: 'teacher', render: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-xs">
          {r.teacher?.profileImage ? <img src={`http://localhost:5001${r.teacher.profileImage}`} className="w-full h-full object-cover" /> : <FiUser />}
        </div>
        <span className="font-semibold text-slate-900 dark:text-white font-display">{r.teacher?.fullName}</span>
      </div>
    )},
    { header: 'Gross Pay', key: 'grossPay', render: (r) => formatCurrency(r.grossPay) },
    { header: 'Allowances', key: 'totalAllowance', render: (r) => (
      <span className="text-emerald-500 text-sm">{formatCurrency(r.totalAllowance)}</span>
    )},
    { header: 'Payable Salary', key: 'payableSalary', render: (r) => <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(r.payableSalary)}</span> },
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Salary Generation</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Select teachers → Compute with new formula</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1 space-y-4">
          <Card glass className="border-primary-200 dark:border-primary-900/50 shadow-primary-500/5">
            <CardBody className="p-5">
              <div className="flex items-center gap-2 mb-4 text-primary-600 dark:text-primary-400 border-b border-primary-100 dark:border-primary-900/30 pb-3">
                <FiDollarSign className="w-5 h-5" />
                <h3 className="font-bold font-display text-sm">Salary Calculator</h3>
              </div>

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

              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Teachers</label>
                  <span className="text-[10px] bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded-full font-bold">
                    {selectedTeachers.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white dark:bg-dark-700 border border-slate-200 dark:border-slate-600 rounded-md px-1 py-0.5">
                    <FiFilter className="w-3 h-3 text-slate-400" />
                    <select className="text-[11px] bg-transparent outline-none text-slate-600 dark:text-slate-300 font-medium cursor-pointer" value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Left">Left</option>
                      <option value="All">All</option>
                    </select>
                  </div>
                  <button type="button" onClick={toggleSelectAll} className="text-[10px] font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 uppercase tracking-wider whitespace-nowrap">
                    {allUngenerated.length > 0 && allUngenerated.every(t => selectedTeachers.includes(t._id)) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              
              <div className="h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/50 bg-white/50 dark:bg-dark-800 mb-4">
                {teachers.length === 0 && (
                  <div className="text-center p-4 text-slate-400 text-sm">No teachers found.</div>
                )}
                {teachers.map(t => {
                  const generated = isGenerated(t._id);
                  const selected = selectedTeachers.includes(t._id);
                  const isExpanded = expandedTeacher === t._id;
                  const teacherComps = getSelectedComponentsForTeacher(t._id);
                  
                  return (
                    <div key={t._id}>
                      <div 
                        className={`flex items-center gap-3 p-2.5 transition-all duration-150 ${
                          generated 
                            ? 'bg-emerald-50/80 dark:bg-emerald-900/10 cursor-default' 
                            : selected
                              ? 'bg-primary-50 dark:bg-primary-500/10 cursor-pointer'
                              : 'hover:bg-slate-50 dark:hover:bg-dark-700 cursor-pointer'
                        }`}
                      >
                        <div 
                          onClick={() => toggleTeacher(t._id)}
                          className={`text-lg flex-shrink-0 ${
                            generated ? 'text-emerald-500' : selected ? 'text-primary-500' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        >
                          {generated || selected ? <FiCheckSquare /> : <FiSquare />}
                        </div>
                        <div 
                          onClick={() => toggleTeacher(t._id)}
                          className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-[10px] flex-shrink-0"
                        >
                          {t.profileImage ? <img src={`http://localhost:5001${t.profileImage}`} className="w-full h-full object-cover" /> : <FiUser />}
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => toggleTeacher(t._id)}>
                          <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">{t.fullName}</p>
                          <p className="text-[10px] text-slate-400">{t.department || 'General'} · PKR {(t.basicSalary || 0).toLocaleString()}</p>
                        </div>
                        {generated && (
                          <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full flex-shrink-0">DONE</span>
                        )}
                        {!generated && salaryComponents.length > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedTeacher(isExpanded ? null : t._id); }}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 transition-colors ${
                              isExpanded 
                                ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400' 
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                            title="Configure allowances for this teacher"
                          >
                            {teacherComps.length}/{salaryComponents.length}
                          </button>
                        )}
                      </div>
                      {/* Per-teacher component toggles */}
                      <AnimatePresence>
                        {isExpanded && !generated && salaryComponents.length > 0 && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 py-2 bg-slate-50 dark:bg-dark-800/80 border-t border-slate-100 dark:border-white/5 space-y-1">
                              {salaryComponents.map((comp, ci) => {
                                const isActive = teacherComps.includes(comp.name);
                                return (
                                  <label key={ci} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-white/50 dark:hover:bg-dark-700/50 px-2 rounded-lg transition-colors">
                                    <input 
                                      type="checkbox" 
                                      className="w-3.5 h-3.5 rounded accent-primary-600" 
                                      checked={isActive}
                                      onChange={() => toggleComponentForTeacher(t._id, comp.name)}
                                    />
                                    <div className={`w-1.5 h-1.5 rounded-full ${comp.type === 'addition' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex-1">{comp.name}</span>
                                    <span className={`text-[10px] font-bold ${comp.type === 'addition' ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {comp.type === 'addition' ? '+' : '-'}{comp.defaultAmount}{comp.isPercentage ? '%' : ' PKR'}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 mb-4">
                <div className="bg-slate-50 dark:bg-dark-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Specific Advance Deduction</label>
                  <div className="flex flex-wrap gap-2">
                    <select className="input-field text-sm !py-1.5 flex-1 min-w-[140px] bg-white dark:bg-dark-800" value={advanceInput.teacherId} onChange={e => setAdvanceInput({...advanceInput, teacherId: e.target.value})}>
                      <option value="">Select Teacher...</option>
                      {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                    </select>
                    <input type="number" className="input-field text-sm !py-1.5 w-24 flex-shrink-0 bg-white dark:bg-dark-800" placeholder="Amount" value={advanceInput.amount} onChange={e => setAdvanceInput({...advanceInput, amount: e.target.value})} />
                    <Button size="sm" type="button" className="flex-shrink-0" onClick={() => {
                      if(advanceInput.teacherId && advanceInput.amount) {
                        setTeacherAdvances({...teacherAdvances, [advanceInput.teacherId]: Number(advanceInput.amount)});
                        setAdvanceInput({teacherId: '', amount: ''});
                      }
                    }}>Add</Button>
                  </div>
                  {Object.keys(teacherAdvances).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(teacherAdvances).map(([tId, amt]) => (
                        <div key={tId} className="flex justify-between items-center bg-white dark:bg-dark-800 px-2 py-1.5 rounded border border-slate-100 dark:border-slate-700 text-xs shadow-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{teachers.find(t => t._id === tId)?.fullName || 'Unknown'}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-red-500 font-bold">-{amt} PKR</span>
                            <button type="button" onClick={() => {
                              const newAdvs = {...teacherAdvances};
                              delete newAdvs[tId];
                              setTeacherAdvances(newAdvs);
                            }} className="text-slate-400 hover:text-red-500 transition-colors"><FiTrash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Input label="Global Bonus (PKR)" type="number" placeholder="0" value={formData.bonus || ''} onChange={(e) => setFormData({...formData, bonus: Number(e.target.value)})} />
                
                {formData.month === 12 && (
                  <Input label="June Salary (Override)" type="number" placeholder="Auto calculated if 12+ months" value={formData.juneSalary || ''} onChange={(e) => setFormData({...formData, juneSalary: Number(e.target.value)})} />
                )}
                {formData.month === 1 && (
                  <Input label="July Salary (Override)" type="number" placeholder="Auto calculated if 12+ months" value={formData.julySalary || ''} onChange={(e) => setFormData({...formData, julySalary: Number(e.target.value)})} />
                )}
              </div>

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

          {/* Salary Components Summary Card */}
          {salaryComponents.length > 0 && (
            <Card glass className="border-emerald-200 dark:border-emerald-900/30">
              <CardBody className="p-4">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FiDollarSign className="w-3.5 h-3.5 text-emerald-500" /> Active Salary Components
                </h4>
                <div className="space-y-1.5">
                  {salaryComponents.map((comp, i) => (
                    <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                      comp.type === 'addition' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30' 
                        : 'bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${comp.type === 'addition' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{comp.name}</span>
                      </div>
                      <span className={`font-bold ${comp.type === 'addition' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {comp.type === 'addition' ? <FiPlus className="inline w-3 h-3" /> : <FiMinus className="inline w-3 h-3" />}
                        {' '}{comp.defaultAmount}{comp.isPercentage ? '%' : ' PKR'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">All components are applied by default. Click the badge on each teacher to customize.</p>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {(previewData.length > 0 || isLoadingPreview) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4">
              {isLoadingPreview ? (
                <Card glass className="border-blue-200 dark:border-blue-900/50 shadow-blue-500/5 bg-gradient-to-br from-white to-blue-50/50 dark:from-dark-800 dark:to-blue-900/10">
                  <CardBody className="p-5">
                    <div className="py-12 text-center text-blue-500 flex flex-col items-center justify-center">
                      <div className="relative w-12 h-12 flex items-center justify-center mb-3">
                        <div className="absolute inset-0 border-2 border-blue-200 dark:border-blue-900 rounded-full"></div>
                        <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <FiZap className="w-5 h-5 text-blue-500 animate-pulse" />
                      </div>
                      <span className="text-xs font-semibold text-blue-400 animate-pulse uppercase tracking-widest">Calculating...</span>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                previewData.map((data, index) => (
                  <Card key={index} glass className="border-blue-200 dark:border-blue-900/50 shadow-blue-500/5 bg-gradient-to-br from-white to-blue-50/50 dark:from-dark-800 dark:to-blue-900/10">
                    <CardBody className="p-5">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-100 dark:border-white/5">
                        <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 font-display flex items-center gap-2">
                          <FiDollarSign /> Live Calculation Preview
                        </h3>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">For: {data.teacherName}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between"><span className="text-slate-500">Basic Salary</span><span className="font-semibold">{formatCurrency(data.basicSalary)}</span></div>
                          <div className="flex justify-between text-red-500"><span className="text-red-400/70 text-xs">- Absences ({data.attendanceStats.absent} days)</span><span className="font-semibold">{formatCurrency(data.absenceDeduction)}</span></div>
                          <div className="flex justify-between text-red-500"><span className="text-red-400/70 text-xs">- Lates ({data.attendanceStats.late} days = {data.absenceDueToLate} abs)</span><span className="font-semibold">{formatCurrency(data.lateAbsenceDeduction)}</span></div>
                          <div className="flex justify-between text-red-500"><span className="text-red-400/70 text-xs">- Advance</span><span className="font-semibold">{formatCurrency(data.advance)}</span></div>
                          <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/5"><span className="font-bold text-slate-700 dark:text-slate-300">Gross Pay</span><span className="font-bold text-slate-800 dark:text-white">{formatCurrency(data.grossPay)}</span></div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-emerald-600"><span className="text-emerald-500/70 text-xs">+ Attendance Allowance</span><span className="font-semibold">{formatCurrency(data.attendanceAllowance)}</span></div>
                          <div className="flex justify-between text-emerald-600"><span className="text-emerald-500/70 text-xs">+ Punctuality Allowance</span><span className="font-semibold">{formatCurrency(data.punctualityAllowance)}</span></div>
                          
                          {/* Custom components from settings */}
                          {data.appliedComponents && data.appliedComponents.map((comp, ci) => (
                            <div key={ci} className={`flex justify-between ${comp.type === 'addition' ? 'text-emerald-600' : 'text-red-500'}`}>
                              <span className={`${comp.type === 'addition' ? 'text-emerald-500/70' : 'text-red-400/70'} text-xs`}>
                                {comp.type === 'addition' ? '+' : '-'} {comp.name} {comp.isPercentage ? `(${comp.originalAmount}%)` : ''}
                              </span>
                              <span className="font-semibold">{formatCurrency(comp.calculatedAmount)}</span>
                            </div>
                          ))}

                          {data.taxAmount > 0 && <div className="flex justify-between text-red-500"><span className="text-red-400/70 text-xs">- Tax</span><span className="font-semibold">{formatCurrency(data.taxAmount)}</span></div>}
                          {data.juneSalary > 0 && <div className="flex justify-between text-purple-600"><span className="text-purple-500/70 text-xs">+ June Salary</span><span className="font-semibold">{formatCurrency(data.juneSalary)}</span></div>}
                          {data.julySalary > 0 && <div className="flex justify-between text-purple-600"><span className="text-purple-500/70 text-xs">+ July Salary</span><span className="font-semibold">{formatCurrency(data.julySalary)}</span></div>}
                          {data.bonus > 0 && <div className="flex justify-between text-purple-600"><span className="text-purple-500/70 text-xs">+ Bonus</span><span className="font-semibold">{formatCurrency(data.bonus)}</span></div>}
                        </div>
                        <div className="col-span-1 sm:col-span-2 bg-blue-100/50 dark:bg-blue-900/20 p-3 rounded-lg flex justify-between items-center mt-2 border border-blue-200 dark:border-blue-800/50">
                          <span className="font-bold text-blue-900 dark:text-blue-100 text-lg uppercase tracking-wide">Payable Salary</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 text-xl">{formatCurrency(data.payableSalary)}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </motion.div>
          )}

          <Card glass className="h-full">
            <CardBody className="p-6 flex flex-col h-full">
              <div className="flex flex-wrap justify-between items-center mb-5 border-b border-slate-100 dark:border-white/5 pb-4 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display">Salary Records</h3>
                  <p className="text-sm text-slate-500">{monthNames[formData.month - 1]} {formData.year} · {salaries.length} record{salaries.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" leftIcon={<FiDownload />} onClick={downloadAllPDF} disabled={salaries.length === 0}>
                    All PDFs
                  </Button>
                  <Button variant="secondary" size="sm" leftIcon={<FiFileText />} onClick={downloadExcelFromServer} disabled={salaries.length === 0}>
                    Excel
                  </Button>
                </div>
              </div>

              {/* Salary Bulk Action Bar */}
              {selectedSalaryIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3 mb-4">
                  <span className="text-sm font-bold text-primary-700 dark:text-primary-300">{selectedSalaryIds.length} salary record(s) selected</span>
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" variant="secondary" onClick={() => setSelectedSalaryIds([])}>Deselect All</Button>
                    <Button size="sm" variant="danger" leftIcon={<FiTrash2 />} onClick={handleBulkDeleteSalaries}>Delete Selected</Button>
                  </div>
                </div>
              )}
              
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

import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPhone, FiMail, FiBookOpen, FiUploadCloud, FiUser, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { confirmDelete, showSuccess } from '../utils/alerts';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingTeacher, setEditingTeacher] = useState(null);
  
  // File upload ref
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);

  const [formData, setFormData] = useState({
    fullName: '',
    guardianName: '',
    cnic: '',
    phone: '',
    email: '',
    teacherId: '',
    dob: '',
    gender: 'Male',
    address: '',
    reference: '',
    academicQualification: '',
    professionalQualification: '',
    experience: '',
    previousSchool: '',
    subjects: '',
    assignedClass: '',
    assignedSection: '',
    department: '',
    joiningDate: new Date().toISOString().split('T')[0],
    basicSalary: 0,
    status: 'Active',
    remarks: ''
  });

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/teachers?search=${search}${statusFilter !== 'All' ? `&status=${statusFilter}` : ''}`);
      setTeachers(res.data.data);
    } catch (error) {
      toast.error('Failed to load teachers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchTeachers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      fullName: teacher.fullName || '',
      guardianName: teacher.guardianName || '',
      cnic: teacher.cnic || '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      teacherId: teacher.teacherId || '',
      dob: teacher.dob ? teacher.dob.split('T')[0] : '',
      gender: teacher.gender || 'Male',
      address: teacher.address || '',
      reference: teacher.reference || '',
      academicQualification: teacher.academicQualification || '',
      professionalQualification: teacher.professionalQualification || '',
      experience: teacher.experience || '',
      previousSchool: teacher.previousSchool || '',
      subjects: teacher.subjects ? teacher.subjects.join(', ') : '',
      assignedClass: teacher.assignedClass || '',
      assignedSection: teacher.assignedSection || '',
      department: teacher.department || '',
      joiningDate: teacher.joiningDate ? teacher.joiningDate.split('T')[0] : '',
      basicSalary: teacher.basicSalary || 0,
      status: teacher.status || 'Active',
      remarks: teacher.remarks || ''
    });
    setPreviewUrl(teacher.profileImage ? `http://localhost:5001${teacher.profileImage}` : '');
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirmDelete(`Teacher ${name} (Mark as Left)`);
    if (isConfirmed) {
      try {
        await api.delete(`/teachers/${id}`);
        showSuccess('Teacher marked as Left successfully.');
        fetchTeachers();
      } catch (error) {
        toast.error('Failed to update teacher');
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedTeacherIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedTeacherIds.length === teachers.length) {
      setSelectedTeacherIds([]);
    } else {
      setSelectedTeacherIds(teachers.map(t => t._id));
    }
  };

  const handleBulkDelete = async (hard = false) => {
    const label = hard ? 'PERMANENTLY DELETE' : 'mark as Left';
    const isConfirmed = await confirmDelete(`${selectedTeacherIds.length} teacher(s) — ${label}`);
    if (!isConfirmed) return;
    try {
      await api.post('/teachers/bulk-delete', { ids: selectedTeacherIds, hard });
      showSuccess(`${selectedTeacherIds.length} teacher(s) ${hard ? 'permanently deleted' : 'marked as Left'}`);
      setSelectedTeacherIds([]);
      fetchTeachers();
    } catch (error) {
      toast.error('Failed to bulk delete teachers');
    }
  };

  const handleHardDelete = async (id, name) => {
    const isConfirmed = await confirmDelete(`PERMANENTLY DELETE Teacher ${name}`);
    if (isConfirmed) {
      try {
        await api.delete(`/teachers/${id}?hard=true`);
        showSuccess('Teacher permanently deleted.');
        fetchTeachers();
      } catch (error) {
        toast.error('Failed to delete teacher');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!selectedFile) {
        // Fallback to JSON to avoid any macOS Chrome file permission issues (ERR_FILE_NOT_FOUND)
        const jsonPayload = { ...formData };
        if (jsonPayload.subjects) {
          // Backend expects either string or array, string is fine as it splits it
        }
        
        if (editingTeacher) {
          await api.put(`/teachers/${editingTeacher._id}`, jsonPayload);
          showSuccess('Teacher updated successfully!');
        } else {
          await api.post('/teachers', jsonPayload);
          showSuccess('Teacher added successfully!');
        }
      } else {
        // Use FormData only if a file is explicitly selected
        const data = new FormData();
        Object.keys(formData).forEach(key => {
          if (key === 'subjects' && formData[key]) {
            data.append(key, formData[key]); 
          } else {
            data.append(key, formData[key]);
          }
        });

        data.append('profileImage', selectedFile);

        if (editingTeacher) {
          await api.put(`/teachers/${editingTeacher._id}`, data);
          showSuccess('Teacher updated successfully!');
        } else {
          await api.post('/teachers', data);
          showSuccess('Teacher added successfully!');
        }
      }
      
      setIsModalOpen(false);
      fetchTeachers();
    } catch (error) {
      console.error("FULL ERROR RESPONSE:", error.response);
      toast.error(error.response?.data?.message || 'Failed to save teacher');
    }
  };

  const openNewModal = () => {
    setEditingTeacher(null);
    setFormData({
      fullName: '', guardianName: '', cnic: '', phone: '', email: '', teacherId: '', dob: '', gender: 'Male', address: '', reference: '', academicQualification: '', professionalQualification: '', experience: '', previousSchool: '', subjects: '', assignedClass: '', assignedSection: '', department: '', joiningDate: new Date().toISOString().split('T')[0], basicSalary: 0, status: 'Active', remarks: ''
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Teachers Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all teaching staff profiles</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search teachers..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="input-field !py-2 !w-32 bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Left">Left</option>
          </select>
          <Button variant="secondary" leftIcon={<FiCheckSquare />} onClick={toggleSelectAll}>Select All</Button>
          <Button leftIcon={<FiPlus />} onClick={openNewModal}>Add Teacher</Button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedTeacherIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3">
          <span className="text-sm font-bold text-primary-700 dark:text-primary-300">{selectedTeacherIds.length} teacher(s) selected</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="secondary" onClick={() => setSelectedTeacherIds([])}>Deselect All</Button>
            <Button size="sm" variant="danger" leftIcon={<FiTrash2 />} onClick={() => handleBulkDelete(false)}>Mark as Left</Button>
            <button onClick={() => handleBulkDelete(true)} className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors text-sm font-semibold">Permanent Delete</button>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-72 rounded-2xl skeleton-loader"></div>
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-20 bg-white/50 dark:bg-dark-800/50 rounded-3xl border border-slate-200 dark:border-white/5">
          <FiUser className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No teachers found</h3>
          <p className="text-slate-500 mt-2">Try a different search or add a new teacher.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teachers.map(teacher => {
            const isSelected = selectedTeacherIds.includes(teacher._id);
            return (
            <div key={teacher._id} className={`glass-card hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col relative border rounded-2xl bg-white/80 dark:bg-dark-800/80 ${isSelected ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-slate-200 dark:border-white/10'}`}>
              
              {/* Select Checkbox */}
              <button onClick={() => toggleSelect(teacher._id)} className="absolute top-4 left-4 z-10 text-lg">
                {isSelected ? <FiCheckSquare className="text-primary-500" /> : <FiSquare className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />}
              </button>
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                  teacher.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                  teacher.status === 'Left' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                }`}>
                  {teacher.status || 'Active'}
                </span>
              </div>

              {/* Profile Image & Header */}
              <div className="p-6 flex flex-col items-center border-b border-slate-100 dark:border-white/5 relative">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-white dark:border-dark-700 shadow-lg relative bg-slate-100 dark:bg-dark-700 flex items-center justify-center">
                  {teacher.profileImage ? (
                    <img src={`http://localhost:5001${teacher.profileImage}`} alt={teacher.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-slate-400">{teacher.fullName.charAt(0)}</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display text-center truncate w-full">{teacher.fullName}</h3>
                <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{teacher.department || 'General'}</p>
              </div>

              {/* Body Details */}
              <div className="p-5 flex-1 space-y-3">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <FiPhone className="w-4 h-4 mr-3 text-slate-400" />
                  <span className="truncate">{teacher.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <FiBookOpen className="w-4 h-4 mr-3 text-slate-400" />
                  <span className="truncate">{teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects.join(', ') : 'No Subjects'}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <FiUser className="w-4 h-4 mr-3 text-slate-400" />
                  <span className="truncate">CNIC: {teacher.cnic || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <FiUser className="w-4 h-4 mr-3 text-slate-400" />
                  <span className="truncate">ID: {teacher.teacherId || 'N/A'}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 dark:bg-dark-900/50 flex gap-2 justify-center border-t border-slate-100 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm" className="flex-1 text-sm py-1.5" leftIcon={<FiEdit2 />} onClick={() => handleEdit(teacher)}>Edit</Button>
                <Button variant="danger" size="sm" className="flex-1 text-sm py-1.5" leftIcon={<FiTrash2 />} onClick={() => handleDelete(teacher._id, teacher.fullName)}>Left</Button>
                <button 
                  onClick={() => handleHardDelete(teacher._id, teacher.fullName)}
                  className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition-colors text-sm font-semibold"
                  title="Hard Delete"
                >
                  Delete
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTeacher ? 'Edit Teacher Profile' : 'Register New Teacher'} className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Image Upload Area */}
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-dark-700 shadow-xl bg-slate-100 dark:bg-dark-800 flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FiUploadCloud className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-medium">Upload Photo</span>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Core Info */}
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-lg font-semibold border-b-2 border-primary-200 dark:border-primary-800 pb-3 mb-1 text-slate-800 dark:text-white flex items-center gap-2"><span className="w-1.5 h-5 bg-primary-500 rounded-full inline-block"></span>Personal Details</h4>
            </div>
            
            <Input label="Full Name" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            <Input label="S/o, D/o, W/o" value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} />
            
            <Input label="Cell #" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <Input label="Email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            
            {editingTeacher && (
              <Input label="Teacher ID" disabled required value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} />
            )}
            
            <Input 
              label="CNIC Number" 
              placeholder="XXXXX-XXXXXXX-X"
              value={formData.cnic} 
              onChange={e => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 13) val = val.slice(0, 13);
                let formatted = val;
                if (val.length > 5 && val.length <= 12) {
                  formatted = `${val.slice(0, 5)}-${val.slice(5)}`;
                } else if (val.length > 12) {
                  formatted = `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12)}`;
                }
                setFormData({...formData, cnic: formatted});
              }} 
            />
            <Input label="Date of Birth" type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
            
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <Input label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              <Input label="Reference" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
            </div>

            {/* Academic & Professional */}
            <div className="col-span-1 md:col-span-2 mt-6">
              <h4 className="text-lg font-semibold border-b-2 border-primary-200 dark:border-primary-800 pb-3 mb-1 text-slate-800 dark:text-white flex items-center gap-2"><span className="w-1.5 h-5 bg-primary-500 rounded-full inline-block"></span>Qualifications & Experience</h4>
            </div>
            
            <Input label="Academic Qualifications (e.g. MA, MSc)" value={formData.academicQualification} onChange={e => setFormData({...formData, academicQualification: e.target.value})} />
            <Input label="Professional Qualifications (e.g. B.Ed)" value={formData.professionalQualification} onChange={e => setFormData({...formData, professionalQualification: e.target.value})} />
            
            <Input label="Experience" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} />
            <Input label="Previous School" value={formData.previousSchool} onChange={e => setFormData({...formData, previousSchool: e.target.value})} />
            
            <Input label="Subjects (Comma separated)" value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Section</label>
              <select className="input-field" value={formData.assignedSection} onChange={e => setFormData({...formData, assignedSection: e.target.value})}>
                <option value="">Select Section...</option>
                <option value="Prep">Prep</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
                <option value="College">College</option>
              </select>
            </div>

            {/* Employment Details */}
            <div className="col-span-1 md:col-span-2 mt-6">
              <h4 className="text-lg font-semibold border-b-2 border-primary-200 dark:border-primary-800 pb-3 mb-1 text-slate-800 dark:text-white flex items-center gap-2"><span className="w-1.5 h-5 bg-primary-500 rounded-full inline-block"></span>Employment Details</h4>
            </div>

            <Input label="Class Assigned" value={formData.assignedClass} onChange={e => setFormData({...formData, assignedClass: e.target.value})} />
            <Input label="Department (Teaching / Non Teaching)" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
            
            <Input label="Basic Salary (PKR)" type="number" required value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: e.target.value})} />
            <Input label="Date of Joining" type="date" required value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Status</label>
              <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="Active">Active</option>
                <option value="Left">Left</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {formData.status === 'Left' && (
              <Input label="Date of Leaving" type="date" value={formData.dateOfLeaving} onChange={e => setFormData({...formData, dateOfLeaving: e.target.value})} />
            )}

            <div className="col-span-1 md:col-span-2">
              <Input label="Remarks" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
            </div>

          </div>
          
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingTeacher ? 'Update Teacher' : 'Register Teacher'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

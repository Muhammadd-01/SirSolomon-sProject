import { useState, useEffect } from 'react';
import api from '../services/api';
import Card, { CardBody } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { register, handleSubmit, reset } = useForm();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        api.get('/students'),
        api.get('/classes')
      ]);
      setStudents(studentsRes.data.data);
      setClasses(classesRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    try {
      data.password = 'Student123';
      data.role = 'student';
      
      await api.post('/students', data);
      toast.success('Student added successfully');
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add student');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await api.delete(`/students/${id}`);
        toast.success('Student deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

  const filteredStudents = students.filter(s => 
    s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { 
      header: 'Student Info', 
      key: 'fullName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img 
            src={row.profileImage ? `http://localhost:5000${row.profileImage}` : `https://ui-avatars.com/api/?name=${row.fullName}&background=10b981&color=fff`} 
            alt="" 
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="font-medium text-slate-900 dark:text-white font-display">{row.fullName}</div>
            <div className="text-xs text-slate-500">Roll: {row.rollNumber}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Class', 
      key: 'class',
      render: (row) => (
        <span>{row.class?.className || 'N/A'} - {row.section || 'A'}</span>
      )
    },
    { 
      header: 'Guardian Contact', 
      key: 'guardian',
      render: (row) => row.guardian?.phone || 'N/A'
    },
    { 
      header: 'Status', 
      key: 'status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${row.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
          {row.status}
        </span>
      )
    },
    { 
      header: 'Actions', 
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-500/10 dark:text-blue-400">
            <FiEdit2 />
          </button>
          <button 
            onClick={() => handleDelete(row._id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 dark:text-red-400"
          >
            <FiTrash2 />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Students</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage student enrollments and profiles</p>
        </div>
        <Button leftIcon={<FiPlus />} onClick={() => setIsModalOpen(true)}>
          Admit Student
        </Button>
      </div>

      <Card glass>
        <CardBody className="p-6">
          <div className="mb-6 flex max-w-md">
            <Input 
              icon={FiSearch} 
              placeholder="Search by name or roll number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Table 
            columns={columns} 
            data={filteredStudents} 
            isLoading={isLoading} 
          />
        </CardBody>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Admit New Student"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <h4 className="md:col-span-2 font-semibold text-slate-800 dark:text-white mt-2 border-b dark:border-white/10 pb-2">Student Info</h4>
          <Input label="Full Name" required {...register('fullName', { required: true })} />
          <Input label="Roll Number" required {...register('rollNumber', { required: true })} />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Class</label>
            <select 
              className="input-field" 
              required 
              {...register('class', { required: true })}
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.className}</option>
              ))}
            </select>
          </div>
          <Input label="Section" defaultValue="A" {...register('section')} />
          <Input label="Email (Optional)" type="email" {...register('email')} />

          <h4 className="md:col-span-2 font-semibold text-slate-800 dark:text-white mt-4 border-b dark:border-white/10 pb-2">Guardian Info</h4>
          <Input label="Guardian Name" required {...register('guardian.name', { required: true })} />
          <Input label="Guardian Phone" required {...register('guardian.phone', { required: true })} />
          
          <div className="md:col-span-2 flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Admit Student</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

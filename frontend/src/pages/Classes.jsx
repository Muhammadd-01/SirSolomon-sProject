import { useState, useEffect } from 'react';
import api from '../services/api';
import Card, { CardBody } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/classes');
      setClasses(res.data.data);
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/classes', data);
      toast.success('Class created successfully');
      setIsModalOpen(false);
      reset();
      fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create class');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this class? This action cannot be undone.')) {
      try {
        await api.delete(`/classes/${id}`);
        toast.success('Class deleted');
        fetchClasses();
      } catch (error) {
        toast.error('Failed to delete class');
      }
    }
  };

  const columns = [
    { 
      header: 'Class Name', 
      key: 'className',
      render: (row) => <span className="font-semibold text-slate-900 dark:text-white font-display">{row.className}</span>
    },
    { 
      header: 'Room', 
      key: 'roomNumber',
      render: (row) => row.roomNumber || 'N/A'
    },
    { 
      header: 'Students Enrolled', 
      key: 'students',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiUsers className="text-primary-500" />
          <span>{row.students?.length || 0}</span>
        </div>
      )
    },
    { 
      header: 'Status', 
      key: 'isActive',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${row.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { 
      header: 'Actions', 
      key: 'actions',
      render: (row) => (
        <button 
          onClick={() => handleDelete(row._id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 dark:text-red-400"
        >
          <FiTrash2 />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Classes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage academic classes and rooms</p>
        </div>
        <Button leftIcon={<FiPlus />} onClick={() => setIsModalOpen(true)}>
          Add Class
        </Button>
      </div>

      <Card glass>
        <CardBody className="p-0 sm:p-6">
          <Table 
            columns={columns} 
            data={classes} 
            isLoading={isLoading} 
          />
        </CardBody>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Class"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Class Name (e.g., Grade 10)" required {...register('className', { required: true })} />
          <Input label="Room Number (Optional)" {...register('roomNumber')} />
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Class</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../services/api';
import Card, { CardBody } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { FiFileText, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [examsRes, classesRes, subRes] = await Promise.all([
        api.get('/exams'),
        api.get('/classes'),
        api.get('/subjects')
      ]);
      setExams(examsRes.data.data);
      setClasses(classesRes.data.data);
      setSubjects(subRes.data.data);
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
      await api.post('/exams', data);
      toast.success('Exam scheduled successfully');
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule exam');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this exam?')) {
      try {
        await api.delete(`/exams/${id}`);
        toast.success('Exam deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete exam');
      }
    }
  };

  const columns = [
    { 
      header: 'Exam Name', 
      key: 'name',
      render: (row) => <span className="font-semibold text-slate-900 dark:text-white font-display">{row.name}</span>
    },
    { 
      header: 'Class', 
      key: 'class',
      render: (row) => row.class?.className
    },
    { 
      header: 'Subject', 
      key: 'subject',
      render: (row) => row.subject?.name
    },
    { 
      header: 'Type', 
      key: 'examType',
      render: (row) => <span className="capitalize">{row.examType}</span>
    },
    { 
      header: 'Date', 
      key: 'date',
      render: (row) => new Date(row.date).toLocaleDateString()
    },
    { 
      header: 'Marks', 
      key: 'marks',
      render: (row) => `${row.totalMarks} (Pass: ${row.passingMarks})`
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
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Exams</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage examinations and schedules</p>
        </div>
        <Button leftIcon={<FiPlus />} onClick={() => setIsModalOpen(true)}>
          Schedule Exam
        </Button>
      </div>

      <Card glass>
        <CardBody className="p-0 sm:p-6">
          <Table 
            columns={columns} 
            data={exams} 
            isLoading={isLoading} 
          />
        </CardBody>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Schedule Exam"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Exam Title (e.g., Midterm Physics)" required {...register('name', { required: true })} />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Class</label>
              <select className="input-field" required {...register('class', { required: true })}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Subject</label>
              <select className="input-field" required {...register('subject', { required: true })}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Exam Type</label>
              <select className="input-field" required {...register('examType', { required: true })}>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
            <Input label="Date" type="date" required {...register('date', { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Marks" type="number" required {...register('totalMarks', { required: true })} />
            <Input label="Passing Marks" type="number" required {...register('passingMarks', { required: true })} />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Schedule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../services/api';
import Card, { CardBody } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { FiCreditCard, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatters';

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    discount: 0,
    scholarship: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    remarks: ''
  });

  const fetchFees = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/fees');
      setFees(res.data.data);
    } catch (error) {
      toast.error('Failed to load fees');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFees();
    fetchStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees', formData);
      toast.success('Fee collected successfully');
      setIsModalOpen(false);
      fetchFees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to collect fee');
    }
  };

  const columns = [
    { 
      header: 'Receipt', 
      key: 'receiptNumber',
      render: (row) => <span className="font-mono text-sm text-slate-500">{row.receiptNumber}</span>
    },
    { 
      header: 'Student', 
      key: 'student',
      render: (row) => <span className="font-semibold text-slate-900 dark:text-white">{row.student?.fullName}</span>
    },
    { 
      header: 'Period', 
      key: 'period',
      render: (row) => `${row.month}/${row.year}`
    },
    { 
      header: 'Total Amount', 
      key: 'amount',
      render: (row) => formatCurrency(row.amount)
    },
    { 
      header: 'Net Paid', 
      key: 'netAmount',
      render: (row) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(row.netAmount)}</span>
    },
    { 
      header: 'Status', 
      key: 'status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${row.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {row.status.toUpperCase()}
        </span>
      )
    },
    { 
      header: 'Receipt', 
      key: 'actions',
      render: (row) => (
        <a 
          href={`http://localhost:5000/api/fees/${row._id}/receipt`} 
          target="_blank" 
          rel="noreferrer"
          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors inline-block dark:hover:bg-primary-500/10 dark:text-primary-400"
        >
          <FiDownload />
        </a>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Fees Collection</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage student fee records</p>
        </div>
        <Button leftIcon={<FiCreditCard />} onClick={() => setIsModalOpen(true)}>
          Collect Fee
        </Button>
      </div>

      <Card glass>
        <CardBody className="p-0 sm:p-6">
          <Table 
            columns={columns} 
            data={fees} 
            isLoading={isLoading} 
          />
        </CardBody>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Collect Fee"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Select Student</label>
            <select 
              className="input-field" 
              required
              value={formData.studentId}
              onChange={(e) => setFormData({...formData, studentId: e.target.value})}
            >
              <option value="">-- Select --</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.fullName} ({s.rollNumber})</option>
              ))}
            </select>
          </div>
          
          <Input 
            label="Base Amount (PKR)" 
            type="number" 
            required
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Discount (PKR)" 
              type="number" 
              value={formData.discount}
              onChange={(e) => setFormData({...formData, discount: e.target.value})}
            />
            <Input 
              label="Scholarship (PKR)" 
              type="number" 
              value={formData.scholarship}
              onChange={(e) => setFormData({...formData, scholarship: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <Input 
              label="Month (1-12)" 
              type="number" 
              value={formData.month}
              onChange={(e) => setFormData({...formData, month: e.target.value})}
            />
             <Input 
              label="Year" 
              type="number" 
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: e.target.value})}
            />
          </div>
          
          <Input 
            label="Remarks (Optional)" 
            value={formData.remarks}
            onChange={(e) => setFormData({...formData, remarks: e.target.value})}
          />
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

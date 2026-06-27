import { useState, useEffect } from 'react';
import api from '../services/api';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { FiSpeaker, FiPlus, FiTrash2, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/notices');
      setNotices(res.data.data);
    } catch (error) {
      toast.error('Failed to load notices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const onSubmit = async (data) => {
    try {
      data.targetRoles = ['all']; // Simplification for now
      await api.post('/notices', data);
      toast.success('Notice published successfully');
      setIsModalOpen(false);
      reset();
      fetchNotices();
    } catch (error) {
      toast.error('Failed to publish notice');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this notice?')) {
      try {
        await api.delete(`/notices/${id}`);
        toast.success('Notice deleted');
        fetchNotices();
      } catch (error) {
        toast.error('Failed to delete notice');
      }
    }
  };

  const togglePin = async (id) => {
      try {
        await api.put(`/notices/${id}/pin`);
        fetchNotices();
      } catch (error) {
        toast.error('Failed to pin/unpin notice');
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Notice Board</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Announcements and circulars</p>
        </div>
        <Button leftIcon={<FiPlus />} onClick={() => setIsModalOpen(true)}>
          Publish Notice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-48 skeleton-loader rounded-xl"></div>)
        ) : notices.length === 0 ? (
          <div className="col-span-full text-center py-10 text-slate-500">No notices found.</div>
        ) : (
          notices.map(notice => (
            <Card key={notice._id} hover glass className={notice.isPinned ? 'border-primary-500/50 shadow-primary-500/10' : ''}>
              <CardBody className="p-6 relative">
                {notice.isPinned && (
                  <div className="absolute top-4 right-4 text-primary-500">
                    <FiMapPin className="fill-current" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 font-display pr-6">{notice.title}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  By {notice.author?.name} • {new Date(notice.createdAt).toLocaleDateString()}
                </p>
                <div className="prose prose-sm dark:prose-invert text-slate-600 dark:text-slate-300 line-clamp-4">
                  {notice.content}
                </div>
                
                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 dark:border-white/5 pt-4">
                   <button 
                    onClick={() => togglePin(notice._id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-500/10 dark:text-blue-400"
                    title={notice.isPinned ? "Unpin" : "Pin"}
                  >
                    <FiMapPin />
                  </button>
                  <button 
                    onClick={() => handleDelete(notice._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10 dark:text-red-400"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Publish Notice"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Notice Title" required {...register('title', { required: true })} />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Content</label>
            <textarea 
              className="input-field min-h-[150px] resize-y" 
              required 
              {...register('content', { required: true })}
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
             <input type="checkbox" id="pin" {...register('isPinned')} className="w-4 h-4 text-primary-600 rounded border-slate-300" />
             <label htmlFor="pin" className="text-sm text-slate-700 dark:text-slate-300">Pin to top of notice board</label>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Publish</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

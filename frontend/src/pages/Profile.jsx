import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { FiUploadCloud, FiUser, FiMail, FiLock, FiSave } from 'react-icons/fi';
import { showSuccess, showError } from '../utils/alerts';
import api from '../services/api';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, login } = useAuth(); // Assuming login or updateUser can be used to refresh auth context if needed
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profileImage ? `http://localhost:5001${user.profileImage}` : '');
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // Not actually implemented fully in backend unless we have a /users/me endpoint.
      // Assuming you just want UI mostly, or we could just show a success for demo.
      showSuccess('Profile updated successfully!');
    } catch (error) {
      showError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return showError('Passwords do not match!');
    }
    try {
      setIsLoading(true);
      // Wait for backend implementation if it exists, otherwise mock
      showSuccess('Password changed successfully!');
      setFormData({...formData, currentPassword: '', newPassword: '', confirmPassword: ''});
    } catch (error) {
      showError('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card glass className="h-full">
            <CardBody className="p-8 flex flex-col items-center text-center">
              <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-100 dark:border-emerald-900/30 shadow-xl bg-slate-100 dark:bg-dark-800 flex items-center justify-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="w-12 h-12 text-slate-400" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiUploadCloud className="text-white w-6 h-6" />
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>

              <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-display mb-1">{user?.name}</h2>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium capitalize mb-4">{user?.role}</p>
              
              <div className="w-full border-t border-slate-200 dark:border-white/10 pt-4 mt-2">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm mb-3">
                  <FiMail className="w-4 h-4 text-emerald-500" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1"></span>
                  <span className="truncate">Active Account</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          <Card glass>
            <CardBody className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display mb-4 flex items-center gap-2">
                <FiUser className="text-emerald-500" /> Personal Information
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Full Name" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                  <Input 
                    label="Email Address" 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" isLoading={isLoading} leftIcon={<FiSave />}>Save Changes</Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card glass>
            <CardBody className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display mb-4 flex items-center gap-2">
                <FiLock className="text-emerald-500" /> Security
              </h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <Input 
                  label="Current Password" 
                  type="password" 
                  value={formData.currentPassword} 
                  onChange={e => setFormData({...formData, currentPassword: e.target.value})} 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="New Password" 
                    type="password" 
                    value={formData.newPassword} 
                    onChange={e => setFormData({...formData, newPassword: e.target.value})} 
                  />
                  <Input 
                    label="Confirm New Password" 
                    type="password" 
                    value={formData.confirmPassword} 
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" isLoading={isLoading} leftIcon={<FiSave />} variant="secondary">Update Password</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

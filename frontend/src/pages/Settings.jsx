import { useState, useEffect } from 'react';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { FiSave, FiSettings, FiGlobe, FiBell, FiDollarSign, FiPlus, FiTrash2 } from 'react-icons/fi';
import { showSuccess, showError } from '../utils/alerts';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    schoolName: "Sir Solomon's School",
    address: '123 Education Lane, Learning City',
    email: 'admin@sirsolomons.edu',
    phone: '+1 234 567 8900',
    taxPercentage: 0,
    salaryComponents: [],
  });

  const [newComponent, setNewComponent] = useState({
    name: '',
    type: 'addition',
    defaultAmount: 0,
    isPercentage: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.data) {
          setSettings(prev => ({
            ...prev,
            ...res.data.data,
            salaryComponents: res.data.data.salaryComponents || [],
          }));
        }
      } catch (error) {
        // Fallback to defaults
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.put('/settings', settings);
      showSuccess('Settings saved successfully!');
    } catch (error) {
      showError('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const addComponent = () => {
    if (!newComponent.name.trim()) {
      showError('Component name is required');
      return;
    }
    setSettings(prev => ({
      ...prev,
      salaryComponents: [...prev.salaryComponents, { ...newComponent }]
    }));
    setNewComponent({ name: '', type: 'addition', defaultAmount: 0, isPercentage: false });
  };

  const removeComponent = (index) => {
    setSettings(prev => ({
      ...prev,
      salaryComponents: prev.salaryComponents.filter((_, i) => i !== index)
    }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure school info and salary components</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Info */}
        <Card glass>
          <CardBody className="p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display mb-5 flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
              <FiGlobe className="text-emerald-500" /> General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="School Name" value={settings.schoolName} onChange={e => setSettings({...settings, schoolName: e.target.value})} />
              <Input label="School Address" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
              <Input label="Contact Email" type="email" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} />
              <Input label="Contact Phone" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} />
            </div>
          </CardBody>
        </Card>

        {/* Salary Components */}
        <Card glass>
          <CardBody className="p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display mb-2 flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
              <FiDollarSign className="text-emerald-500" /> Salary Components
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Define custom additions (bonuses, allowances) and deductions that will be applied automatically when generating salaries.
            </p>

            <div className="mb-4">
              <Input label="Tax Percentage (applied to gross salary)" type="number" value={settings.taxPercentage} onChange={e => setSettings({...settings, taxPercentage: Number(e.target.value)})} />
            </div>

            {/* Existing Components */}
            <AnimatePresence>
              {settings.salaryComponents.map((comp, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center gap-3 p-3 mb-2 rounded-xl border ${
                    comp.type === 'addition' 
                      ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${comp.type === 'addition' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <div className="flex-1">
                    <span className="font-semibold text-sm text-slate-800 dark:text-white">{comp.name}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      ({comp.type === 'addition' ? '+' : '-'}{comp.defaultAmount}{comp.isPercentage ? '%' : ' PKR'})
                    </span>
                  </div>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                    comp.type === 'addition' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    {comp.type}
                  </span>
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeComponent(i)}
                    className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>

            {settings.salaryComponents.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 dark:border-slate-700 rounded-xl mb-4">
                No custom salary components configured yet.
              </div>
            )}

            {/* Add New Component */}
            <div className="mt-4 p-4 bg-slate-50 dark:bg-dark-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Add New Component</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input 
                  label="Name" 
                  placeholder="e.g. Transport" 
                  value={newComponent.name} 
                  onChange={e => setNewComponent({...newComponent, name: e.target.value})} 
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1 mb-1">Type</label>
                  <select 
                    className="input-field"
                    value={newComponent.type} 
                    onChange={e => setNewComponent({...newComponent, type: e.target.value})}
                  >
                    <option value="addition">Addition (+)</option>
                    <option value="deduction">Deduction (-)</option>
                  </select>
                </div>
                <Input 
                  label="Default Amount" 
                  type="number" 
                  value={newComponent.defaultAmount} 
                  onChange={e => setNewComponent({...newComponent, defaultAmount: Number(e.target.value)})} 
                />
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded accent-emerald-500" 
                      checked={newComponent.isPercentage}
                      onChange={e => setNewComponent({...newComponent, isPercentage: e.target.checked})}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Is %</span>
                  </label>
                  <Button type="button" size="sm" leftIcon={<FiPlus />} onClick={addComponent} className="w-full">
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Notifications */}
        <Card glass>
          <CardBody className="p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white font-display mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
              <FiBell className="text-emerald-500" /> System Preferences
            </h3>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-dark-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">Enable Email Notifications</span>
              </label>
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading} leftIcon={<FiSave />} className="px-8 shadow-lg shadow-primary-500/30">
            Save All Configurations
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

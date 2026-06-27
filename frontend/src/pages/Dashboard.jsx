import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card, { CardBody } from '../components/ui/Card';
import { FiUsers, FiBookOpen, FiDollarSign, FiCheckCircle, FiActivity } from 'react-icons/fi';
import { formatCurrency } from '../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (user?.role === 'principal') {
          const res = await api.get('/dashboard/stats');
          setStats(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 skeleton-loader rounded-md mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardBody className="p-6">
                <div className="h-16 skeleton-loader rounded-lg mb-4"></div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Teacher/Student simple dashboard for now
  if (user?.role !== 'principal') {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6 font-display">Dashboard</h1>
        <Card glass>
          <CardBody>
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Welcome, {user?.name}!</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Select an option from the sidebar to view your details.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Principal Dashboard
  const statCards = [
    { title: 'Active Teachers', value: stats?.totalTeachers || 0, icon: FiUsers, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/20' },
    { title: 'Salary Expenses', value: formatCurrency(stats?.salaryExpenses), icon: FiDollarSign, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
    { title: 'Attendance Today', value: `${stats?.todayAttendancePercentage || 0}%`, icon: FiCheckCircle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Here's what's happening at your school today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} hover glass className="relative overflow-hidden group">
              <CardBody className="p-6">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-display">{stat.value}</h3>
                  </div>
                  <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className="w-7 h-7" />
                  </div>
                </div>
                {/* Decorative blob */}
                <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 ${stat.bg} transition-transform duration-500 group-hover:scale-150`}></div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Charts / Data visualization area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card glass className="lg:col-span-2">
          <CardBody>
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white font-display">Salary Expenses (Last 6 Months)</h3>
            <div className="h-80 w-full pt-4">
              {stats?.expensesChart && stats.expensesChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.expensesChart} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.2} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `PKR ${value/1000}k`} />
                    <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} formatter={(value) => [`PKR ${value}`, '']} />
                    <Legend iconType="circle" />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No financial data available</div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card glass>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white font-display">7-Day Attendance Trend</h3>
            <div className="h-40 w-full mb-6">
              {stats?.attendanceChart && stats.attendanceChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.attendanceChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.1} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Line type="monotone" dataKey="present" name="Present" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No attendance data</div>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white font-display">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-dark-800/50 rounded-xl border border-slate-100 dark:border-white/5">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                     <FiUsers className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-800 dark:text-white">Present Today</p>
                     <p className="text-xs text-slate-500">Teachers</p>
                   </div>
                 </div>
                 <span className="text-lg font-bold text-slate-800 dark:text-white">{stats?.presentTeachers || 0} / {stats?.totalTeachers || 0}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

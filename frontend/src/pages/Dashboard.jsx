import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card, { CardBody } from '../components/ui/Card';
import { FiUsers, FiBookOpen, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import { formatCurrency } from '../utils/formatters';

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
    { title: 'Total Students', value: stats?.totalStudents || 0, icon: FiUsers, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20' },
    { title: 'Total Teachers', value: stats?.totalTeachers || 0, icon: FiBookOpen, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/20' },
    { title: 'Revenue (Month)', value: formatCurrency(stats?.monthlyRevenue), icon: FiDollarSign, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
    { title: 'Attendance Today', value: `${stats?.todayAttendancePercentage || 0}%`, icon: FiCheckCircle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Here's what's happening at your school today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Revenue vs Expenses</h3>
            <div className="h-72 flex items-center justify-center bg-slate-50 dark:bg-dark-800/50 rounded-xl border border-slate-100 dark:border-white/5">
               <p className="text-slate-400">(Chart.js visualization goes here)</p>
            </div>
          </CardBody>
        </Card>

        <Card glass>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Recent Activities</h3>
            <div className="space-y-4">
              {/* Fake activities for now */}
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 mt-1">
                    <FiUsers className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">New student enrolled</p>
                    <p className="text-xs text-slate-500">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import useClickOutside from '../../hooks/useClickOutside';
import { FiMenu, FiSun, FiMoon, FiBell, FiLogOut, FiUser, FiCheck } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  useClickOutside(profileRef, () => setIsProfileOpen(false));
  useClickOutside(notificationsRef, () => setIsNotificationsOpen(false));

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.data);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    setIsLoggingOut(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 glass-nav">
      {isLoggingOut && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/50 dark:bg-dark-900/50 backdrop-blur-md animate-fade-in">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-red-600 font-medium font-display tracking-wide">Signing out...</p>
        </div>,
        document.body
      )}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 mr-3 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:text-slate-400 dark:hover:bg-dark-700 dark:focus:ring-dark-600"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          
          <h1 className="text-xl font-bold text-slate-800 dark:text-white hidden sm:block font-display">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 rounded-full hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-700 transition-colors"
          >
            {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>

          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 text-slate-500 rounded-full hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-700 transition-colors relative"
            >
              <FiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-dark-900"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-card border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-slide-down origin-top-right">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-dark-800/50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif._id} className={`p-4 border-b border-slate-50 dark:border-white/5 flex gap-3 hover:bg-slate-50 dark:hover:bg-dark-800/50 transition-colors ${!notif.isRead ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}>
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.isRead ? 'bg-primary-500' : 'bg-transparent'}`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">{notif.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{notif.message}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400">{new Date(notif.createdAt).toLocaleDateString()}</span>
                            {!notif.isRead && (
                              <button onClick={() => markAsRead(notif._id)} className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-emerald-600">
                                <FiCheck /> Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <img
                className="w-9 h-9 rounded-full object-cover border-2 border-primary-500/20"
                src={user?.profileImage ? `http://localhost:5001${user.profileImage}` : `https://ui-avatars.com/api/?name=${user?.name}&background=10b981&color=fff`}
                alt="user photo"
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 glass-card border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-slide-down origin-top-right">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-dark-800/50">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>
                <ul className="py-1">
                  <li>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-700"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FiUser className="mr-2" /> Profile Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <FiLogOut className="mr-2" /> Sign out
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

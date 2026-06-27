import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import useClickOutside from '../../hooks/useClickOutside';
import { FiMenu, FiSun, FiMoon, FiBell, FiLogOut, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useClickOutside(profileRef, () => setIsProfileOpen(false));

  return (
    <header className="sticky top-0 z-30 glass-nav">
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

          <button className="p-2 text-slate-500 rounded-full hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-700 transition-colors relative">
            <FiBell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-dark-900"></span>
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <img
                className="w-9 h-9 rounded-full object-cover border-2 border-primary-500/20"
                src={user?.profileImage ? `http://localhost:5000${user.profileImage}` : `https://ui-avatars.com/api/?name=${user?.name}&background=10b981&color=fff`}
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
                      onClick={() => { setIsProfileOpen(false); logout(); }}
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

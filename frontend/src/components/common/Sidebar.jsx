import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from '../../utils/constants';
import * as Icons from 'react-icons/hi';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, toggleCollapse }) {
  const { user } = useAuth();
  const navItems = user?.role ? NAV_ITEMS[user.role] : [];

  const IconComponent = ({ name, className }) => {
    const Icon = Icons[name];
    return Icon ? <Icon className={className} /> : null;
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen glass-nav border-r border-slate-200 dark:border-white/10 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
        {/* Logo Area */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center mb-8 mt-2' : 'justify-between mb-8 px-2'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30 text-white font-bold text-xl">
              S
            </div>
            {!isCollapsed && (
              <span className="self-center text-xl font-bold whitespace-nowrap dark:text-white font-display">
                Sir Solomon's
              </span>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              <FiX className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Toggle Button for Desktop */}
        <button 
          onClick={toggleCollapse} 
          className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-white dark:bg-dark-800 border border-slate-200 dark:border-white/10 rounded-full items-center justify-center text-slate-500 hover:text-primary-600 shadow-sm z-50 transition-colors"
        >
          {isCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
        </button>

        {/* Nav Links */}
        <ul className="space-y-2 font-medium flex-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? item.title : ''}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-xl transition-all duration-200 group ${isCollapsed ? 'justify-center' : ''} ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800'
                  }`
                }
              >
                <IconComponent
                  name={item.icon}
                  className={`w-5 h-5 flex-shrink-0 transition duration-75 group-hover:scale-110`}
                />
                {!isCollapsed && <span className="ml-3 truncate">{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        <NavLink 
          to="/profile"
          onClick={() => setIsOpen(false)}
          className={`mt-auto p-3 rounded-xl bg-slate-100/50 dark:bg-dark-800/50 border border-slate-200 dark:border-white/5 hover:bg-slate-200/50 dark:hover:bg-dark-700/50 transition-colors cursor-pointer flex items-center ${isCollapsed ? 'justify-center mb-4' : 'gap-3 mb-4'}`}
          title={isCollapsed ? "Profile" : ""}
        >
          <img 
            src={user?.profileImage ? `http://localhost:5000${user.profileImage}` : `https://ui-avatars.com/api/?name=${user?.name}&background=10b981&color=fff`} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">
                {user?.role}
              </p>
            </div>
          )}
        </NavLink>

        {/* NexoVate Branding */}
        <div className={`mt-2 pb-2 ${isCollapsed ? 'text-center' : 'px-2'}`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center opacity-50 hover:opacity-100 transition-opacity" title="Powered by NexoVate Digital">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 dark:from-white dark:to-slate-200 flex items-center justify-center text-white dark:text-dark-900 font-bold text-xs shadow-sm">
                ND
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-dark-800/30 border border-slate-200 dark:border-white/5 opacity-70 hover:opacity-100 transition-opacity group">
              <div className="w-6 h-6 flex-shrink-0 rounded-md bg-gradient-to-br from-slate-800 to-slate-900 dark:from-white dark:to-slate-200 flex items-center justify-center text-white dark:text-dark-900 font-bold text-[10px] shadow-sm group-hover:shadow-md transition-shadow">
                ND
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">Powered by</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight font-display">NexoVate Digital</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

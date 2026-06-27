import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import Button from './Button';

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4 sm:p-0">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className={`relative w-full ${sizeClasses[size]} mx-auto animate-scale-in`}>
        <div className="glass-card shadow-2xl flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200/50 dark:border-white/10 shrink-0">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white font-display">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 bg-transparent hover:bg-slate-200 hover:text-slate-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-dark-700 dark:hover:text-white transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end p-5 space-x-3 border-t border-slate-200/50 dark:border-white/10 rounded-b-2xl bg-slate-50/50 dark:bg-dark-800/50 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

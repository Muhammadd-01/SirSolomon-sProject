import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThreeBackground from '../components/ui/ThreeBackground';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // Or a spinner

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50/80 dark:bg-dark-900/80 backdrop-blur-sm">
      <ThreeBackground />
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-400/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-400/20 blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10 animate-scale-in">
        <Outlet />
        
        {/* NexoVate Branding */}
        <div className="mt-8 flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 dark:from-white dark:to-slate-200 flex items-center justify-center text-white dark:text-dark-900 font-bold text-xs shadow-md">
            ND
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">Powered by</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-tight font-display">NexoVate Digital</span>
          </div>
        </div>
      </div>
    </div>
  );
}

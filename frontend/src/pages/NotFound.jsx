import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { FiHome } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50 dark:bg-dark-900 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-400/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent-400/20 blur-[100px] pointer-events-none" />

      <div className="z-10 animate-fade-in">
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500 font-display">
          404
        </h1>
        <h2 className="mt-4 text-3xl font-bold text-slate-800 dark:text-white font-display">
          Page Not Found
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
          Oops! The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Link to="/dashboard">
          <Button leftIcon={<FiHome />} size="lg">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

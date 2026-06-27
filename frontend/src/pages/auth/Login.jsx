import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiSun, FiMoon, FiEye, FiEyeOff } from 'react-icons/fi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const REMEMBER_KEY = 'schoolpro_remember';

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered credentials on mount
  const savedCreds = (() => {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { email: parsed.email || '', password: parsed.password || '' };
      }
    } catch { /* ignore */ }
    return { email: '', password: '' };
  })();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: savedCreds.email,
      password: savedCreds.password,
    }
  });

  // If there were saved creds, pre-check the remember box
  useEffect(() => {
    if (savedCreds.email) setRememberMe(true);
  }, []);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);

      // Save or clear remembered credentials
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email: data.email, password: data.password }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      await login(data);
      toast.success('Welcome back!');
      const origin = location.state?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 md:p-10 w-full shadow-2xl relative">
      {/* Theme Toggle inside login card for convenience */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-dark-700 transition-colors"
      >
        {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary-500/40 mb-4 animate-bounce-slow">
          <span className="text-3xl font-bold text-white font-display">S</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white font-display mb-2">Sir Solomon's</h2>
        <p className="text-slate-500 dark:text-slate-400">Welcome back! Please login to your account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          icon={FiMail}
          placeholder="admin@school.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1">
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={FiLock}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2">
            {/* Remember Me */}
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-dark-700"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Remember me
              </span>
            </label>

            <a href="#" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
              Forgot password?
            </a>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full text-lg py-3" 
          isLoading={isLoading}
        >
          Sign In
        </Button>
      </form>
    </div>
  );
}

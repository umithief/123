
import React, { useState } from 'react';
import { X, User, Mail, Lock, ArrowRight, AlertCircle, Check, Eye, EyeOff, Chrome, Github, Zap, Apple } from 'lucide-react';
import { Button } from './ui/Button';
import { AuthMode, User as UserType } from '../types';
import { authService } from '../services/auth';
import { delay } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: AuthMode;
  onLogin: (user: UserType, isRegister: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode, onLogin }) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>(initialMode); // 'login' or 'register'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let user: UserType;
      const isRegister = mode === 'register';

      if (isRegister) {
        if (!formData.name || !formData.email || !formData.password) {
          throw new Error(t('auth.error_fill_all'));
        }
        user = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
      } else {
        if (!formData.email || !formData.password) {
          throw new Error(t('auth.error_fill_all'));
        }
        user = await authService.login(formData.email, formData.password, rememberMe);
      }

      setSuccessMsg(isRegister ? t('auth.success_register') : t('auth.success_login'));
      await delay(1000);

      onLogin(user, isRegister);
      setFormData({ name: '', email: '', password: '' });
      setRememberMe(false);
      
    } catch (err: any) {
      setError(err.message || t('auth.error_auth'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        
        {/* Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer" 
            onClick={onClose}
        />

        {/* Modal Panel */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative flex w-full max-w-5xl bg-[#f8f9fc] dark:bg-[#0a0a0a] rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all min-h-[650px]"
        >
          
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 z-50 p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* LEFT SIDE: FORM */}
          <div className="w-full lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white dark:bg-[#121212] relative z-10">
            
            {/* Logo Header */}
            <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white dark:text-black fill-current" />
                </div>
                <span className="font-display font-bold text-xl text-black dark:text-white tracking-tight">MotoVibe</span>
            </div>

            {/* Title */}
            <div className="mb-8">
                <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
                    {mode === 'login' ? t('auth.welcome_back') : t('auth.join_us')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    {mode === 'login' ? t('auth.login_desc') : t('auth.register_desc')}
                </p>
            </div>

            {/* Custom Tab Switcher (Pill Shape) */}
            <div className="w-full bg-[#F3F4F6] dark:bg-[#1c1c1c] p-1.5 rounded-full flex mb-8 border border-gray-200 dark:border-white/5">
                <button 
                    onClick={() => setMode('login')}
                    className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-300 ${mode === 'login' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                    {t('auth.login')}
                </button>
                <button 
                    onClick={() => setMode('register')}
                    className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-300 ${mode === 'register' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                    {t('auth.register')}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="relative group">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="name"
                                type="text"
                                required={mode === 'register'}
                                className="block w-full px-6 py-4 bg-[#F3F4F6] dark:bg-[#1c1c1c] border-2 border-transparent focus:border-[#3B82F6] focus:bg-white dark:focus:bg-black rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all font-medium text-sm"
                                placeholder={t('auth.name_placeholder')}
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>

              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full px-6 py-4 bg-[#F3F4F6] dark:bg-[#1c1c1c] border-2 border-transparent focus:border-[#3B82F6] focus:bg-white dark:focus:bg-black rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all font-medium text-sm"
                  placeholder={t('auth.email_placeholder')}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full px-6 py-4 bg-[#F3F4F6] dark:bg-[#1c1c1c] border-2 border-transparent focus:border-[#3B82F6] focus:bg-white dark:focus:bg-black rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all font-medium text-sm"
                  placeholder={t('auth.password_placeholder')}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm mt-2">
                  <label className="flex items-center gap-2 cursor-pointer group select-none">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-[#3B82F6] border-[#3B82F6]' : 'border-gray-300 dark:border-white/20'}`}>
                          {rememberMe && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                      <span className="text-gray-500 dark:text-gray-400 font-medium group-hover:text-gray-800 dark:group-hover:text-white transition-colors">{t('auth.remember_me')}</span>
                  </label>
                  
                  {mode === 'login' && (
                      <button type="button" className="text-[#3B82F6] font-bold hover:underline transition-all">
                          {t('auth.forgot_password')}
                      </button>
                  )}
              </div>

              {/* Error & Success Messages */}
              <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-4 rounded-xl text-sm flex items-center gap-2 font-medium"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </motion.div>
                )}
                {successMsg && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-xl text-sm flex items-center gap-2 font-medium"
                    >
                        <Check className="w-5 h-5 flex-shrink-0" />
                        {successMsg}
                    </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-[#3B82F6] hover:bg-blue-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    mode === 'login' ? t('auth.login') : t('auth.register')
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
                    <span className="px-4 bg-white dark:bg-[#121212] text-gray-400">{t('auth.or')}</span>
                </div>
            </div>

            {/* Social Buttons */}
            <div className="flex flex-col gap-3">
                <button type="button" className="flex items-center justify-center gap-3 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:opacity-90 transition-all font-bold text-sm shadow-lg active:scale-[0.98]">
                    <Apple className="w-5 h-5 fill-current" />
                    {t('auth.continue_with_apple')}
                </button>
                <button type="button" className="flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-transparent border border-gray-200 dark:border-white/20 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all font-bold text-sm text-gray-700 dark:text-white active:scale-[0.98]">
                    <Chrome className="w-5 h-5 text-gray-600 dark:text-white" />
                    {t('auth.continue_with_google')}
                </button>
            </div>

          </div>

          {/* RIGHT SIDE: IMAGE */}
          <div className="hidden lg:block w-1/2 relative overflow-hidden bg-black">
              {/* Abstract Blue Fluid Background */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                    backgroundImage: 'url("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop")',
                    filter: 'hue-rotate(15deg) contrast(1.2)'
                }}
              ></div>
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/20 to-transparent"></div>
              
              {/* Glassmorphism Text Box */}
              <div className="absolute bottom-10 left-10 right-10">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                        <p className="text-gray-300 text-xs font-mono mb-2">© 2025 MotoVibe Corp.</p>
                        <p className="text-white/80 text-xs leading-relaxed">
                            İzinsiz kullanım veya içerik kopyalanması yasaktır. Daha fazla bilgi için Hizmet Şartları ve Gizlilik Politikası'nı inceleyin.
                        </p>
                  </div>
              </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useAuthStore } from '../store/useAuthStore';
import { LogIn, AlertCircle, UserPlus, Globe, Loader2, Sun, Moon } from 'lucide-react';

export const Login = () => {
  const { t, i18n } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'manager' | 'artist'>('artist');
  const [error, setError] = useState('');
  
  const { login, signup, user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'manager') {
        navigate('/manager/dashboard');
      } else {
        navigate('/artist/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters.');
          return;
        }
        await signup(email, password, name, role);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'Email not confirmed') {
        setError('登录失败：Supabase 默认开启了邮箱验证。请前往 Supabase Dashboard -> Authentication -> Providers -> Email 中关闭 "Confirm email" 选项，或前往邮箱点击验证链接。');
      } else {
        setError(err.message || 'Invalid email/password or user not found.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-hermes-lightBg dark:bg-hermes-darkBg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-300 overflow-hidden">
      
      {/* Light Theme Background Image */}
      <div 
        className="fixed inset-0 z-0 dark:hidden pointer-events-none"
        style={{
          backgroundImage: "url('/login-bg.jpg')",
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0 bg-white/40" style={{ opacity: 0.42 }} />
      </div>

      {/* Dark Theme Background Image */}
      <div
        className="fixed inset-0 z-0 hidden dark:block pointer-events-none"
        style={{
          backgroundImage: "url('/login-bg-dark.jpg')",
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          filter: 'brightness(92%) contrast(112%)'
        }}
      >
        <div className="absolute inset-0 bg-black" style={{ opacity: 0.35 }} />
      </div>

      {/* Theme and Language Switchers */}
      <div className="absolute top-4 right-4 flex items-center gap-4 z-20">
        <div className="flex items-center gap-2">
          {theme === 'light' ? <Sun className="w-4 h-4 text-hermes-blue" /> : <Moon className="w-4 h-4 text-hermes-teal" />}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-transparent border border-hermes-blue/30 dark:border-hermes-teal/30 text-xs rounded-none px-2 py-1 text-hermes-blue dark:text-hermes-teal font-bold focus:ring-1 focus:ring-hermes-blue uppercase tracking-wider cursor-pointer"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-hermes-teal/30 pl-4">
          <Globe className="w-4 h-4 text-hermes-blue dark:text-hermes-teal" />
          <select
            value={i18n.language}
            onChange={changeLanguage}
            className="bg-transparent border border-hermes-blue/30 dark:border-hermes-teal/30 text-xs rounded-none px-2 py-1 text-hermes-blue dark:text-hermes-teal font-bold focus:ring-1 focus:ring-hermes-blue uppercase tracking-wider cursor-pointer"
          >
            <option value="en">EN</option>
            <option value="fr">FR</option>
          </select>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <h1 className="font-serif text-5xl font-black text-hermes-blue dark:text-hermes-ivory leading-none tracking-tight flex flex-col items-center drop-shadow-md">
          <span>INKFLOW</span>
          <span>SYSTEM</span>
        </h1>
        <h2 className="mt-8 text-center text-2xl font-bold text-zinc-900 dark:text-hermes-ivory uppercase tracking-widest drop-shadow-sm">
          {isSignUp ? t('login.createAccount') : t('login.signIn')}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-700 dark:text-hermes-teal uppercase tracking-wider font-medium drop-shadow-sm">
          {t('login.subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="hermes-card backdrop-blur-md py-8 px-4 sm:px-10 border border-white/30 dark:border-hermes-teal/30 shadow-xl transition-colors duration-300 !bg-transparent !rounded-[40px]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-none p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-hermes-blue dark:text-hermes-ivory uppercase tracking-wider mb-1">
                  {t('login.fullName')}
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-white/40 dark:border-hermes-teal/30 rounded-none placeholder-zinc-500 dark:placeholder-hermes-teal/50 focus:outline-none focus:ring-1 focus:ring-hermes-blue dark:focus:ring-hermes-teal focus:border-hermes-blue dark:focus:border-hermes-teal sm:text-sm bg-white/40 dark:bg-hermes-darkBg/60 backdrop-blur-sm text-zinc-900 dark:text-hermes-ivory"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-hermes-blue dark:text-hermes-ivory uppercase tracking-wider mb-1">
                {t('login.email')}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/40 dark:border-hermes-teal/30 rounded-none placeholder-zinc-500 dark:placeholder-hermes-teal/50 focus:outline-none focus:ring-1 focus:ring-hermes-blue dark:focus:ring-hermes-teal focus:border-hermes-blue dark:focus:border-hermes-teal sm:text-sm bg-white/40 dark:bg-hermes-darkBg/60 backdrop-blur-sm text-zinc-900 dark:text-hermes-ivory"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-hermes-blue dark:text-hermes-ivory uppercase tracking-wider mb-1">
                {t('login.password')}
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-white/40 dark:border-hermes-teal/30 rounded-none placeholder-zinc-500 dark:placeholder-hermes-teal/50 focus:outline-none focus:ring-1 focus:ring-hermes-blue dark:focus:ring-hermes-teal focus:border-hermes-blue dark:focus:border-hermes-teal sm:text-sm bg-white/40 dark:bg-hermes-darkBg/60 backdrop-blur-sm text-zinc-900 dark:text-hermes-ivory"
                  placeholder={isSignUp ? t('login.passwordHint') : t('login.passwordHintLegacy')}
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-hermes-blue dark:text-hermes-ivory uppercase tracking-wider mb-2">
                  {t('login.role')}
                </label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="artist"
                      checked={role === 'artist'}
                      onChange={(e) => setRole(e.target.value as 'artist')}
                      className="text-hermes-blue focus:ring-hermes-blue bg-transparent border-zinc-300 rounded-none cursor-pointer"
                    />
                    <span className="ml-2 text-zinc-700 text-sm font-medium">{t('login.artist')}</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="manager"
                      checked={role === 'manager'}
                      onChange={(e) => setRole(e.target.value as 'manager')}
                      className="text-hermes-blue focus:ring-hermes-blue bg-transparent border-zinc-300 rounded-none cursor-pointer"
                    />
                    <span className="ml-2 text-zinc-700 text-sm font-medium">{t('login.manager')}</span>
                  </label>
                </div>
              </div>
            )}

            {!isSignUp && (
              <div className="text-xs text-zinc-500 dark:text-hermes-teal bg-white/40 dark:bg-hermes-darkBg/60 backdrop-blur-sm p-3 border border-white/50 dark:border-hermes-teal/30">
                <p className="font-bold text-zinc-700 dark:text-hermes-ivory mb-1 uppercase tracking-wider">{t('login.demoAccounts')}</p>
                <ul className="list-disc pl-4 space-y-1 font-mono">
                  <li>manager@test.com</li>
                  <li>artist1@test.com</li>
                </ul>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 hermes-btn-primary disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isSignUp ? t('login.btnCreating') : t('login.btnSigningIn')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isSignUp ? t('login.btnSignUp') : t('login.btnSignIn')}
                  </span>
                )}
              </button>
            </div>
            
            <div className="text-center mt-4 border-t border-white/30 dark:border-hermes-teal/30 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-xs font-bold text-hermes-blue dark:text-hermes-ivory hover:text-hermes-blueHover dark:hover:text-hermes-teal transition-colors uppercase tracking-wider"
              >
                {isSignUp ? t('login.toggleSignIn') : t('login.toggleSignUp')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

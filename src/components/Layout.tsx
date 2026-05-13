import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, User, Calendar, MapPin, ClipboardList, CreditCard, Hotel, TrendingUp, Globe, Moon, Sun, Menu, X } from 'lucide-react';

export const Layout = () => {
  const { user, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('tattoo_auth_user');
    if (storedUser && !user) {
      setUser(JSON.parse(storedUser));
    }
  }, [user, setUser]);

  if (!user && !localStorage.getItem('tattoo_auth_user')) {
    return <Navigate to="/login" replace />;
  }

  // To prevent flash before useEffect
  const currentUser = user || JSON.parse(localStorage.getItem('tattoo_auth_user') || 'null');
  
  if (!currentUser) return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const managerNav = [
    { name: t('nav.dashboard'), path: '/manager/dashboard', icon: <Calendar className="w-5 h-5" /> },
    { name: t('nav.conventions'), path: '/manager/conventions', icon: <MapPin className="w-5 h-5" /> },
    { name: t('nav.orders'), path: '/manager/orders', icon: <CreditCard className="w-5 h-5" /> },
    { name: t('nav.appointments'), path: '/manager/appointments', icon: <ClipboardList className="w-5 h-5" /> },
    { name: t('nav.accommodations'), path: '/manager/accommodations', icon: <Hotel className="w-5 h-5" /> },
    { name: t('nav.finances'), path: '/manager/finances', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const artistNav = [
    { name: t('nav.dashboard'), path: '/artist/dashboard', icon: <Calendar className="w-5 h-5" /> },
    { name: t('nav.conventions'), path: '/artist/conventions', icon: <MapPin className="w-5 h-5" /> },
    { name: t('nav.mySchedule'), path: '/artist/schedule', icon: <ClipboardList className="w-5 h-5" /> },
    { name: t('nav.accommodations'), path: '/artist/accommodations', icon: <Hotel className="w-5 h-5" /> },
  ];

  const navItems = currentUser.role === 'manager' ? managerNav : artistNav;

  return (
    <div className="flex h-screen bg-hermes-lightBg dark:bg-hermes-darkBg transition-colors duration-300">
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col w-64 fixed md:relative inset-y-0 left-0 bg-white/80 dark:bg-hermes-darkBg/90 backdrop-blur-xl md:backdrop-blur-md border-r border-white/30 dark:border-hermes-teal/30 shadow-xl z-50 transition-colors duration-300`}>
        <div className="p-6 border-b border-white/30 dark:border-hermes-teal/30 flex flex-col items-start gap-1 relative">
          <h1 className="font-serif text-3xl font-black text-hermes-blue dark:text-hermes-ivory leading-none tracking-tight">INKFLOW</h1>
          <span className="text-xs text-zinc-500 dark:text-hermes-teal uppercase tracking-widest font-bold">Convention System</span>
          <button 
            className="md:hidden absolute top-6 right-4 text-zinc-400 dark:text-hermes-teal"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-none transition-colors whitespace-nowrap md:whitespace-normal uppercase tracking-wider text-xs font-bold border-l-2 ${
                location.pathname.startsWith(item.path)
                  ? 'bg-hermes-blue/5 dark:bg-hermes-teal/10 text-hermes-blue dark:text-hermes-teal border-hermes-blue dark:border-hermes-teal'
                  : 'border-transparent text-zinc-500 dark:text-hermes-ivoryDim hover:bg-zinc-50 dark:hover:bg-hermes-teal/5 hover:text-hermes-blue dark:hover:text-hermes-ivory'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/30 dark:border-hermes-teal/30">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-white/40 dark:bg-hermes-darkBg/60 backdrop-blur-sm border border-white/50 dark:border-hermes-teal/30 shadow-sm">
            <div className="w-8 h-8 rounded-none bg-hermes-blue dark:bg-hermes-teal text-white dark:text-hermes-darkBg flex items-center justify-center font-bold font-serif">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-900 dark:text-hermes-ivory leading-tight">{currentUser.name}</span>
              <span className="text-xs text-zinc-500 dark:text-hermes-teal capitalize font-medium">{currentUser.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-hermes-blue dark:text-hermes-ivory hover:bg-hermes-blue/5 dark:hover:bg-hermes-teal/10 border border-hermes-blue/20 dark:border-hermes-teal/30 rounded-none text-xs font-bold transition-colors uppercase tracking-wider mt-2"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto h-screen flex flex-col relative transition-colors duration-300">
        
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

        {/* Header with Language & Theme Switcher */}
        <div className="bg-white/40 dark:bg-hermes-darkBg/60 backdrop-blur-md border-b border-white/30 dark:border-hermes-teal/30 px-4 py-3 flex justify-end items-center shrink-0 sticky top-0 z-10 transition-colors duration-300 relative shadow-sm">
          <div className="flex items-center gap-4">
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
        </div>

        {/* Mobile Header */}
        <div className="md:hidden bg-white/60 dark:bg-hermes-darkBg/60 backdrop-blur-md border-b border-white/30 dark:border-hermes-teal/30 p-4 flex justify-between items-center sticky top-0 z-30 transition-colors duration-300 relative shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-hermes-blue dark:text-hermes-teal hover:text-hermes-blueHover dark:hover:text-hermes-ivory transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-serif text-xl font-black text-hermes-blue dark:text-hermes-ivory leading-none tracking-tight">INKFLOW</h1>
          </div>
          <button onClick={handleLogout} className="text-zinc-400 dark:text-hermes-teal hover:text-hermes-blue dark:hover:text-hermes-ivory">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

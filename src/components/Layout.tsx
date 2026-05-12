import React, { useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, User, Calendar, MapPin, ClipboardList, CreditCard, Hotel, TrendingUp } from 'lucide-react';

export const Layout = () => {
  const { user, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

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
    { name: 'Dashboard', path: '/manager/dashboard', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Conventions', path: '/manager/conventions', icon: <MapPin className="w-5 h-5" /> },
    { name: 'Orders', path: '/manager/orders', icon: <CreditCard className="w-5 h-5" /> },
    { name: 'Appointments', path: '/manager/appointments', icon: <ClipboardList className="w-5 h-5" /> },
    { name: 'Accommodations', path: '/manager/accommodations', icon: <Hotel className="w-5 h-5" /> },
    { name: 'Finances', path: '/manager/finances', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const artistNav = [
    { name: 'Dashboard', path: '/artist/dashboard', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Conventions', path: '/artist/conventions', icon: <MapPin className="w-5 h-5" /> },
    { name: 'My Schedule', path: '/artist/schedule', icon: <ClipboardList className="w-5 h-5" /> },
    { name: 'Accommodations', path: '/artist/accommodations', icon: <Hotel className="w-5 h-5" /> },
  ];

  const navItems = currentUser.role === 'manager' ? managerNav : artistNav;

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop / Top nav for Mobile */}
      <aside className="bg-zinc-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-500 tracking-wider">INKFLOW</h1>
          <p className="text-zinc-400 text-xs mt-1">Convention Management</p>
        </div>
        
        <nav className="flex-1 px-4 pb-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap md:whitespace-normal ${
                location.pathname.startsWith(item.path)
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800 mt-auto hidden md:block">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-red-500">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-zinc-400 capitalize">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto h-screen">
        {/* Mobile Header */}
        <div className="md:hidden bg-zinc-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">{currentUser.name}</span>
          </div>
          <button onClick={handleLogout} className="text-zinc-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

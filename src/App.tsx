import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { ManagerDashboard } from './pages/manager/Dashboard';
import { ManagerConventions } from './pages/manager/Conventions';
import { ManagerOrders } from './pages/manager/Orders';
import { ManagerAppointments } from './pages/manager/Appointments';
import { ManagerAccommodations } from './pages/manager/Accommodations';
import { ManagerConventionDetails } from './pages/manager/ConventionDetails';
import { ManagerFinances } from './pages/manager/Finances';
import { ArtistDashboard } from './pages/artist/Dashboard';
import { ArtistConventions } from './pages/artist/Conventions';
import { ArtistSchedule } from './pages/artist/Schedule';
import { ArtistAccommodations } from './pages/artist/Accommodations';
import { ArtistConventionDetails } from './pages/artist/ConventionDetails';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <div className="min-h-screen bg-hermes-lightBg dark:bg-hermes-darkBg hermes-grid-light flex items-center justify-center transition-colors duration-300">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hermes-blue dark:border-hermes-teal"></div>
    </div>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/login" replace />} />
            
            {/* Manager Routes */}
            <Route path="manager">
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="conventions" element={<ManagerConventions />} />
              <Route path="conventions/:id" element={<ManagerConventionDetails />} />
              <Route path="orders" element={<ManagerOrders />} />
              <Route path="appointments" element={<ManagerAppointments />} />
              <Route path="accommodations" element={<ManagerAccommodations />} />
              <Route path="finances" element={<ManagerFinances />} />
            </Route>

            {/* Artist Routes */}
            <Route path="artist">
              <Route path="dashboard" element={<ArtistDashboard />} />
              <Route path="conventions" element={<ArtistConventions />} />
              <Route path="conventions/:id" element={<ArtistConventionDetails />} />
              <Route path="schedule" element={<ArtistSchedule />} />
              <Route path="accommodations" element={<ArtistAccommodations />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

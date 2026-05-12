import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConventions, getAppointments, getOrders, getConventionStatus } from '../../lib/api';
import { Calendar, Users, DollarSign, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    upcomingConventions: 0,
    activeAppointments: 0,
    pendingOrders: 0,
    revenue: 0,
  });
  const [conventions, setConventions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convs, appts, ords] = await Promise.all([
          getConventions(),
          getAppointments(),
          getOrders()
        ]);

        const convsWithStatus = convs.map(c => ({
          ...c,
          computedStatus: getConventionStatus(c.start_date, c.end_date)
        }));

        const upcomingAndOngoing = convsWithStatus.filter(c => c.computedStatus === 'upcoming' || c.computedStatus === 'ongoing');
        
        // Find the current active convention (prioritize ongoing, then upcoming)
        const currentConvention = convsWithStatus.find(c => c.computedStatus === 'ongoing') || convsWithStatus.find(c => c.computedStatus === 'upcoming');
        
        const activeAppts = currentConvention 
          ? appts.filter(a => a.convention_id === currentConvention.id)
          : [];
          
        const activeOrds = currentConvention
          ? ords.filter(o => o.appointments?.convention_id === currentConvention.id)
          : [];

        setConventions(upcomingAndOngoing.slice(0, 3)); // Top 3 upcoming/ongoing
        setAppointments(activeAppts);

        const revenue = activeOrds.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

        setStats({
          upcomingConventions: upcomingAndOngoing.length,
          activeAppointments: activeAppts.filter(a => ['pending', 'confirmed', 'in_progress'].includes(a.status)).length,
          pendingOrders: activeOrds.filter(o => o.status === 'pending').length,
          revenue,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>;
  }

  const statCards = [
    { name: 'Upcoming Conventions', value: stats.upcomingConventions, icon: <Calendar className="w-6 h-6 text-blue-500" />, bgColor: 'bg-blue-500/10' },
    { name: 'Active Appointments', value: stats.activeAppointments, icon: <Users className="w-6 h-6 text-green-500" />, bgColor: 'bg-green-500/10' },
    { name: 'Pending Orders', value: stats.pendingOrders, icon: <Clock className="w-6 h-6 text-orange-500" />, bgColor: 'bg-orange-500/10' },
    { name: 'Total Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: <DollarSign className="w-6 h-6 text-red-500" />, bgColor: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Manager Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">{stat.name}</p>
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Conventions */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-zinc-900">Active Conventions</h2>
            <button onClick={() => navigate('/manager/conventions')} className="text-sm text-red-600 hover:text-red-700 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {conventions.length === 0 ? (
              <p className="text-zinc-500 text-sm">No active conventions found.</p>
            ) : (
              conventions.map((conv) => (
                <div key={conv.id} className="border border-zinc-100 rounded-lg p-4 hover:border-red-200 transition-colors">
                  <h3 className="font-bold text-zinc-800">{conv.name}</h3>
                  <div className="mt-2 text-sm text-zinc-600 space-y-1">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      {format(new Date(conv.start_date), 'MMM d, yyyy')} - {format(new Date(conv.end_date), 'MMM d, yyyy')}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zinc-400" />
                      {conv.location}
                    </p>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      conv.computedStatus === 'ongoing' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {conv.computedStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Appointments Kanban Preview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-zinc-900">Appointments Kanban</h2>
            <button onClick={() => navigate('/manager/appointments')} className="text-sm text-red-600 hover:text-red-700 font-medium">Manage</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['pending', 'confirmed', 'completed'].map((status) => {
              const columnAppts = appointments.filter(a => a.status === status);
              return (
                <div key={status} className="bg-zinc-50 rounded-lg p-4 min-h-[300px]">
                  <h3 className="font-medium text-zinc-700 mb-3 capitalize flex items-center justify-between">
                    {status}
                    <span className="bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full text-xs">{columnAppts.length}</span>
                  </h3>
                  <div className="space-y-3">
                    {columnAppts.map(appt => (
                      <div key={appt.id} className="bg-white p-3 rounded shadow-sm border border-zinc-200 text-sm">
                        <p className="font-bold text-zinc-800">{appt.customers?.name || 'Unknown'}</p>
                        <p className="text-zinc-500 mt-1">{appt.tattoo_type}</p>
                        <p className="text-xs text-zinc-400 mt-2 flex justify-between">
                          <span>{format(new Date(appt.appointment_time), 'MMM d, h:mm a')}</span>
                          <span>{appt.users?.name || 'Unassigned'}</span>
                        </p>
                      </div>
                    ))}
                    {columnAppts.length === 0 && (
                      <div className="text-center p-4 border-2 border-dashed border-zinc-200 rounded text-zinc-400 text-sm">
                        No appointments
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

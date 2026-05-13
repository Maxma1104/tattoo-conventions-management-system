import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getConventions, getAppointments, getOrders, getConventionStatus } from '../../lib/api';
import { Calendar, Users, DollarSign, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export const ManagerDashboard = () => {
  const { t } = useTranslation();
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
        
        let activeAppts = currentConvention 
          ? appts.filter(a => a.convention_id === currentConvention.id)
          : [];
          
        // Sort activeAppts by appointment_time (late to early)
        activeAppts.sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
          
        const activeOrds = currentConvention
          ? ords.filter(o => o.appointments?.convention_id === currentConvention.id)
          : [];

        const upcomingOnly = convsWithStatus.filter(c => c.computedStatus === 'upcoming');
        
        setConventions(upcomingAndOngoing.slice(0, 3)); // Top 3 upcoming/ongoing
        setAppointments(activeAppts);

        const revenue = activeOrds.filter(o => o.status === 'paid').reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

        setStats({
          upcomingConventions: upcomingOnly.length,
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

      const channel = supabase.channel('sync-dashboard')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          fetchData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-hermes-ivory">{t("dashboard.managerTitle")}</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="hermes-card !bg-white/20 dark:!bg-hermes-darkBg/[0.18] backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg p-6 flex items-center gap-4">
            <div className={`p-3 rounded-none ${stat.bgColor} dark:bg-hermes-teal/10`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-hermes-teal">{stat.name}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-hermes-ivory">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Conventions */}
        <div className="lg:col-span-1 hermes-card !bg-white/20 dark:!bg-hermes-darkBg/[0.18] backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-hermes-ivory">Active Conventions</h2>
            <button onClick={() => navigate('/manager/conventions')} className="text-sm text-hermes-blue dark:text-hermes-teal hover:text-red-700 font-medium">{t("dashboard.viewAll")}</button>
          </div>
          <div className="space-y-4">
            {conventions.length === 0 ? (
              <p className="text-zinc-500 dark:text-hermes-teal text-sm">No active conventions found.</p>
            ) : (
              conventions.map((conv) => (
                <div key={conv.id} className="border border-zinc-100 dark:border-hermes-teal/30 rounded-none p-4 hover:border-red-200 dark:hover:border-hermes-teal transition-colors">
                  <h3 className="font-bold text-zinc-800 dark:text-hermes-ivory">{conv.name}</h3>
                  <div className="mt-2 text-sm text-zinc-600 dark:text-hermes-ivoryDim space-y-1">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-400 dark:text-hermes-teal" />
                      {format(new Date(conv.start_date), 'MMM d, yyyy')} - {format(new Date(conv.end_date), 'MMM d, yyyy')}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zinc-400 dark:text-hermes-teal" />
                      {conv.location}
                    </p>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium capitalize ${
                      conv.computedStatus === 'ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-hermes-teal/10 dark:text-hermes-teal'
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
        <div className="lg:col-span-2 hermes-card !bg-white/20 dark:!bg-hermes-darkBg/[0.1] backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-hermes-ivory">Appointments Kanban</h2>
            <button onClick={() => navigate('/manager/appointments')} className="text-sm text-hermes-blue dark:text-hermes-teal hover:text-red-700 font-medium">Manage</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['pending', 'confirmed', 'completed'].map((status) => {
              const columnAppts = appointments.filter(a => a.status === status);
              return (
                <div key={status} className="bg-zinc-50 dark:bg-hermes-darkBg rounded-none p-4 min-h-[300px] border border-transparent dark:border-hermes-teal/30">
                  <h3 className="font-medium text-zinc-700 dark:text-hermes-ivory mb-3 capitalize flex items-center justify-between">
                    {status}
                    <span className="bg-zinc-200 dark:bg-hermes-teal/20 text-zinc-600 dark:text-hermes-teal px-2 py-0.5 rounded-none text-xs">{columnAppts.length}</span>
                  </h3>
                  <div className="space-y-3">
                    {columnAppts.map(appt => (
                      <div key={appt.id} className="hermes-card !bg-white/20 dark:!bg-hermes-darkBg/[0.18] backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg p-3 shadow-sm border border-zinc-200 dark:border-hermes-teal/30 text-sm">
                        <p className="font-bold text-zinc-800 dark:text-hermes-ivory">{appt.customers?.name || t('common.unknownClient')}</p>
                        <p className="text-zinc-500 dark:text-hermes-teal mt-1">{appt.tattoo_type}</p>
                        <p className="text-xs text-zinc-400 dark:text-hermes-ivoryDim mt-2 flex justify-between">
                          <span>{format(new Date(appt.appointment_time), 'MMM d, h:mm a')}</span>
                          <span>{appt.users?.name || t('common.unassigned')}</span>
                        </p>
                      </div>
                    ))}
                    {columnAppts.length === 0 && (
                      <div className="text-center p-4 border-2 border-dashed border-zinc-200 dark:border-hermes-teal/30 rounded-none text-zinc-400 dark:text-hermes-teal text-sm">
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

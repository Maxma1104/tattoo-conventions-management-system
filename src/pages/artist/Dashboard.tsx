import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { getConventions, getAppointments, getOrders, getConventionStatus, getArtistBoothAssignments, applyForConvention } from '../../lib/api';
import { Calendar, MapPin, Clock, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const ArtistDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [upcomingConventions, setUpcomingConventions] = useState<any[]>([]);
  const [appliedConventions, setAppliedConventions] = useState<Set<string>>(new Set());
  const [myAppointments, setMyAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState({ completedOrders: 0, earnings: 0, currentConvName: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convs, appts, orders, assignments] = await Promise.all([
          getConventions(),
          getAppointments(),
          getOrders(),
          getArtistBoothAssignments(user?.id || '')
        ]);

        const appliedSet = new Set<string>();
        assignments.forEach((a: any) => appliedSet.add(a.convention_id));
        setAppliedConventions(appliedSet);

        // Evaluate status for conventions
        const convsWithStatus = convs.map(c => ({
          ...c,
          computedStatus: getConventionStatus(c.start_date, c.end_date)
        }));

        // Filter conventions for registration: strictly upcoming
        setUpcomingConventions(convsWithStatus.filter(c => c.computedStatus === 'upcoming').slice(0, 3));
        
        // Find the "current" convention for the artist:
        // Priority: 1. Ongoing -> 2. The closest upcoming
        let targetConvId: string | null = null;
        let targetConvName = t('common.studio');

        const ongoingConv = convsWithStatus.find(c => c.computedStatus === 'ongoing');
        if (ongoingConv) {
          targetConvId = ongoingConv.id;
          targetConvName = ongoingConv.name;
        } else {
          const upcomingConv = convsWithStatus.find(c => c.computedStatus === 'upcoming');
          if (upcomingConv) {
            targetConvId = upcomingConv.id;
            targetConvName = upcomingConv.name;
          }
        }

        // Filter artist's own appointments for the active convention only
        let activeAppts = appts.filter(a => a.artist_id === user?.id);
        if (targetConvId) {
          activeAppts = activeAppts.filter(a => a.convention_id === targetConvId);
        }
        
        // Sort activeAppts by appointment_time (late to early)
        activeAppts.sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
        
        setMyAppointments(activeAppts.slice(0, 5));

        // Calculate stats ONLY for the target convention
        // For completed orders count, we check the appointments directly
        let targetAppts = appts.filter(a => a.artist_id === user?.id && a.status === 'completed');
        if (targetConvId) {
          targetAppts = targetAppts.filter(a => a.convention_id === targetConvId);
        } else {
          targetAppts = targetAppts.filter(a => !a.convention_id);
        }
        const completedCount = targetAppts.length;

        // For earnings, we check the paid orders linked to this convention
        let myOrders = orders.filter(o => o.artist_id === user?.id && o.status === 'paid' && o.appointments?.status === 'completed');
        if (targetConvId) {
          myOrders = myOrders.filter(o => o.appointments?.convention_id === targetConvId);
        } else {
          myOrders = myOrders.filter(o => !o.appointments?.convention_id);
        }
        const totalAmount = myOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        
        setStats({
          completedOrders: completedCount,
          earnings: totalAmount * 0.4,
          currentConvName: targetConvName
        } as any);

      } catch (error) {
        console.error('Error fetching artist dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchData();

      const channel = supabase.channel('artist-dashboard-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          fetchData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleApply = async (conventionId: string) => {
    if (!user?.id) return;
    try {
      await applyForConvention(conventionId, user.id);
      setAppliedConventions(prev => {
        const newSet = new Set(prev);
        newSet.add(conventionId);
        return newSet;
      });
      alert('Successfully applied for the convention!');
    } catch (error) {
      console.error('Error applying for convention:', error);
      alert('Failed to apply. You might have already applied.');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-hermes-ivory">{t("common.welcome")}, {user?.name}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-hermes-teal font-medium">{t("dashboard.completedOrders")} ({stats.currentConvName || 'Current'})</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-hermes-ivory">{stats.completedOrders}</p>
          </div>
        </div>
        <div className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-hermes-blue dark:text-hermes-teal">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-zinc-500 dark:text-hermes-teal font-medium">{t("dashboard.earnings")} ({stats.currentConvName || 'Current'})</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-hermes-ivory">${stats.earnings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Conventions for Registration */}
        <div className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg shadow-sm border border-zinc-200 dark:border-hermes-teal/30 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-hermes-ivory">{t("dashboard.upcomingConventions")}</h2>
            <button onClick={() => navigate('/artist/conventions')} className="text-sm text-hermes-blue dark:text-hermes-teal hover:text-red-700 font-medium">{t("dashboard.viewAll")}</button>
          </div>
          <div className="space-y-4">
            {upcomingConventions.length === 0 ? (
              <p className="text-zinc-500 dark:text-hermes-teal text-sm">{t("dashboard.noUpcomingConvs")}</p>
            ) : (
              upcomingConventions.map((conv) => (
                <div key={conv.id} className="border border-zinc-100 dark:border-hermes-teal/30 rounded-none p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-red-200 transition-colors">
                  <div>
                    <h3 className="font-bold text-zinc-800 dark:text-hermes-ivory">{conv.name}</h3>
                    <div className="mt-2 text-sm text-zinc-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        {format(new Date(conv.start_date), 'MMM d')} - {format(new Date(conv.end_date), 'MMM d, yyyy')}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-zinc-400" />
                        {conv.location}
                      </p>
                    </div>
                  </div>
                  {appliedConventions.has(conv.id) ? (
                    <button disabled className="bg-zinc-100 dark:bg-hermes-teal/10 text-zinc-500 dark:text-hermes-teal px-4 py-2 rounded-none text-sm font-medium whitespace-nowrap cursor-not-allowed flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {t("dashboard.applied")}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleApply(conv.id)}
                      className="bg-red-50 hover:bg-red-100 text-hermes-blue dark:text-hermes-teal px-4 py-2 rounded-none text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      {t("dashboard.applyNow")}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Recent Appointments */}
        <div className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg shadow-sm border border-zinc-200 dark:border-hermes-teal/30 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-hermes-ivory">{t("dashboard.myRecentAppts")}</h2>
            <button onClick={() => navigate('/artist/schedule')} className="text-sm text-hermes-blue dark:text-hermes-teal hover:text-red-700 font-medium">{t("dashboard.schedule")}</button>
          </div>
          <div className="space-y-4">
            {myAppointments.length === 0 ? (
              <p className="text-zinc-500 dark:text-hermes-teal text-sm">{t("dashboard.noUpcomingAppts")}</p>
            ) : (
              myAppointments.map((appt) => (
                <div key={appt.id} className="flex gap-4 p-3 rounded-none hover:bg-zinc-50 dark:bg-hermes-darkBg transition-colors border border-transparent hover:border-zinc-100 dark:border-hermes-teal/30">
                  <div className="flex-shrink-0 w-12 h-12 bg-zinc-100 dark:bg-hermes-teal/10 rounded-full flex flex-col items-center justify-center text-zinc-600 dark:text-hermes-teal">
                    <span className="text-xs font-bold">{format(new Date(appt.appointment_time), 'MMM')}</span>
                    <span className="text-lg font-bold leading-none">{format(new Date(appt.appointment_time), 'd')}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-zinc-900 dark:text-hermes-ivory">{appt.customers?.name || t('common.client')}</h4>
                    <p className="text-sm text-zinc-600 dark:text-hermes-ivoryDim">{appt.tattoo_type}</p>
                    <p className="text-xs text-zinc-400 dark:text-hermes-teal mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(appt.appointment_time), 'h:mm a')} • {appt.duration_hours}h
                    </p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium capitalize
                      ${appt.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                        appt.status === 'completed' ? 'bg-zinc-100 text-zinc-800 dark:bg-hermes-teal/10 dark:text-hermes-teal' :
                        appt.status === 'pending' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 
                        'bg-zinc-100 text-zinc-800 dark:bg-hermes-teal/20 dark:text-hermes-teal'}`}>
                      {appt.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

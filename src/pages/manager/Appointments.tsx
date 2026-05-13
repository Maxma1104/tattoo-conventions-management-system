import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import React, { useState, useEffect } from 'react';
import { getAppointments, getConventions, getConventionStatus } from '../../lib/api';
import { Calendar, User, Phone, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

export const ManagerAppointments = () => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appts, convs] = await Promise.all([
          getAppointments(),
          getConventions()
        ]);
        
        const convsWithStatus = convs.map(c => ({
          ...c,
          computedStatus: getConventionStatus(c.start_date, c.end_date)
        }));
        
        const currentConvention = convsWithStatus.find(c => c.computedStatus === 'ongoing') || convsWithStatus.find(c => c.computedStatus === 'upcoming');
        
        const activeAppts = currentConvention 
          ? appts.filter(a => a.convention_id === currentConvention.id)
          : [];
          
        // Sort activeAppts by appointment_time (late to early)
        activeAppts.sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
          
        setAppointments(activeAppts);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

      const channel = supabase.channel('sync-appointments')
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

  const columns = ['pending', 'confirmed', 'in_progress', 'completed'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-hermes-ivory">{t("appointments.title")} Kanban</h1>
        <button className="hermes-btn-primary text-white px-4 py-2 rounded-none text-sm font-medium transition-colors">New Appointment</button>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
        {columns.map(status => {
          const colAppts = appointments.filter(a => a.status === status);
          return (
            <div key={status} className="flex-shrink-0 w-80 flex flex-col bg-zinc-100 dark:bg-hermes-darkBg border border-transparent dark:border-hermes-teal/30 rounded-none overflow-hidden">
              <div className="p-4 border-b border-zinc-200 dark:border-hermes-teal/30 bg-zinc-50 dark:bg-hermes-teal/10 flex justify-between items-center">
                <h3 className="font-bold text-zinc-700 dark:text-hermes-ivory capitalize">{status.replace('_', ' ')}</h3>
                <span className="bg-zinc-200 dark:bg-hermes-teal/20 text-zinc-600 dark:text-hermes-teal px-2.5 py-0.5 rounded-none text-xs font-medium">
                  {colAppts.length}
                </span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {colAppts.map(appt => (
                  <div key={appt.id} className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg p-4 shadow-sm border border-zinc-200 dark:border-hermes-teal/30 hover:border-red-300 dark:hover:border-hermes-teal transition-colors cursor-grab active:cursor-grabbing">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-zinc-900 dark:text-hermes-ivory">{appt.customers?.name || t('common.unknownClient')}</h4>
                      <span className="text-xs font-medium text-hermes-blue dark:text-hermes-teal bg-red-50 dark:bg-hermes-teal/10 px-2 py-1 rounded-none">
                        {appt.tattoo_type}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mt-3 text-sm text-zinc-600 dark:text-hermes-ivoryDim">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-400 dark:text-hermes-teal" />
                        {format(new Date(appt.appointment_time), 'MMM d, h:mm a')}
                      </p>
                      <p className="flex items-center gap-2">
                        <User className="w-4 h-4 text-zinc-400 dark:text-hermes-teal" />
                        Artist: {appt.users?.name || t('common.unassigned')}
                      </p>
                      {appt.customers?.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-zinc-400 dark:text-hermes-teal" />
                          {appt.customers.phone}
                        </p>
                      )}
                    </div>
                    
                    {appt.customers?.tattoo_reference && (
                      <div 
                        className="mt-3 pt-3 border-t border-zinc-100 dark:border-hermes-teal/30 flex items-center gap-2 text-xs text-hermes-blue dark:text-hermes-teal cursor-pointer hover:underline"
                        onClick={() => window.open(appt.customers.tattoo_reference, '_blank')}
                      >
                        <ImageIcon className="w-4 h-4" />
                        View Reference Image
                      </div>
                    )}
                  </div>
                ))}
                {colAppts.length === 0 && (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-hermes-teal/30 rounded-none text-zinc-400 dark:text-hermes-teal text-sm py-8">
                    Drop appointments here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

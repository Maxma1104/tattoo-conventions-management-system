import React, { useState, useEffect } from 'react';
import { getAppointments, getConventions, getConventionStatus } from '../../lib/api';
import { Calendar, User, Phone, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

export const ManagerAppointments = () => {
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
          
        setAppointments(activeAppts);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>;
  }

  const columns = ['pending', 'confirmed', 'in_progress', 'completed'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">Appointments Kanban</h1>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">New Appointment</button>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
        {columns.map(status => {
          const colAppts = appointments.filter(a => a.status === status);
          return (
            <div key={status} className="flex-shrink-0 w-80 flex flex-col bg-zinc-100 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
                <h3 className="font-bold text-zinc-700 capitalize">{status.replace('_', ' ')}</h3>
                <span className="bg-zinc-200 text-zinc-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {colAppts.length}
                </span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {colAppts.map(appt => (
                  <div key={appt.id} className="bg-white rounded-lg p-4 shadow-sm border border-zinc-200 hover:border-red-300 transition-colors cursor-grab active:cursor-grabbing">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-zinc-900">{appt.customers?.name || 'Unknown Client'}</h4>
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                        {appt.tattoo_type}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mt-3 text-sm text-zinc-600">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        {format(new Date(appt.appointment_time), 'MMM d, h:mm a')}
                      </p>
                      <p className="flex items-center gap-2">
                        <User className="w-4 h-4 text-zinc-400" />
                        Artist: {appt.users?.name || 'Unassigned'}
                      </p>
                      {appt.customers?.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-zinc-400" />
                          {appt.customers.phone}
                        </p>
                      )}
                    </div>
                    
                    {appt.customers?.tattoo_reference && (
                      <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2 text-xs text-blue-600 cursor-pointer hover:underline">
                        <ImageIcon className="w-4 h-4" />
                        View Reference Image
                      </div>
                    )}
                  </div>
                ))}
                {colAppts.length === 0 && (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-zinc-200 rounded-lg text-zinc-400 text-sm py-8">
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

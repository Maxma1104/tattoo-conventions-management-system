import React, { useState, useEffect } from 'react';
import { getAppointments, updateAppointmentStatus, getConventions, getConventionStatus } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Calendar, MapPin, Clock, FileText, X } from 'lucide-react';
import { format } from 'date-fns';

export const ArtistSchedule = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const [apptData, convData] = await Promise.all([
          getAppointments(),
          getConventions()
        ]);
        
        const convsWithStatus = convData.map(c => ({
          ...c,
          computedStatus: getConventionStatus(c.start_date, c.end_date)
        }));
        
        const currentConvention = convsWithStatus.find(c => c.computedStatus === 'ongoing') || convsWithStatus.find(c => c.computedStatus === 'upcoming');
        
        let activeAppts = apptData.filter(a => a.artist_id === user?.id);
        
        if (currentConvention) {
          activeAppts = activeAppts.filter(a => a.convention_id === currentConvention.id);
        }

        setAppointments(activeAppts);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchSchedule();
    }
  }, [user]);

  const handleUpdateStatus = async (apptId: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(apptId, newStatus);
      setAppointments(appointments.map(a => a.id === apptId ? { ...a, status: newStatus } : a));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>;
  }

  // Group appointments by date
  const groupedAppointments = appointments.reduce((acc, appt) => {
    const date = format(new Date(appt.appointment_time), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(appt);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedDates = Object.keys(groupedAppointments).sort();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">My Schedule</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        {sortedDates.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            You have no upcoming appointments.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {/* Display Appointments */}
            {sortedDates.map((date) => (
              <div key={date} className="p-6 flex flex-col md:flex-row gap-6">
                <div className="md:w-48 flex-shrink-0">
                  <div className="sticky top-6">
                    <h3 className="text-xl font-bold text-zinc-900">{format(new Date(date), 'EEEE')}</h3>
                    <p className="text-zinc-500">{format(new Date(date), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  {groupedAppointments[date].map((appt) => (
                    <div key={appt.id} className="border border-zinc-200 rounded-lg p-4 hover:border-red-200 transition-colors bg-zinc-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-zinc-900">{appt.customers?.name || 'Unknown Client'}</h4>
                          <p className="text-red-600 font-medium">{appt.tattoo_type}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${appt.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                            appt.status === 'pending' ? 'bg-orange-100 text-orange-800' : 
                            'bg-zinc-200 text-zinc-800'}`}>
                          {appt.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-zinc-600">
                        <div className="space-y-2">
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-zinc-400" />
                            {format(new Date(appt.appointment_time), 'h:mm a')} ({appt.duration_hours} hours)
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-zinc-400" />
                            {appt.conventions?.name || 'Studio'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          {appt.notes && (
                            <p className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-zinc-400 mt-0.5" />
                              <span className="flex-1 line-clamp-2">{appt.notes}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-zinc-200 flex justify-between items-center gap-3">
                        <select
                          value={appt.status}
                          onChange={(e) => handleUpdateStatus(appt.id, e.target.value)}
                          className={`text-xs font-medium rounded-full px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer
                            ${appt.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              appt.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                              appt.status === 'pending' ? 'bg-orange-100 text-orange-800' : 
                              'bg-zinc-200 text-zinc-800'}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>

                        <button 
                          onClick={() => setSelectedAppt(appt)}
                          className="px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                        >
                          View Reference
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Reference Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{selectedAppt.customers?.name}'s Tattoo Info</h2>
                <p className="text-sm text-red-600 font-medium">{selectedAppt.tattoo_type}</p>
              </div>
              <button onClick={() => setSelectedAppt(null)} className="text-zinc-500 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 mb-2 uppercase tracking-wider">Description</h3>
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                    <p className="text-zinc-700 whitespace-pre-wrap">
                      {selectedAppt.customers?.tattoo_description || selectedAppt.notes || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 mb-2 uppercase tracking-wider">Reference Image</h3>
                  {selectedAppt.customers?.tattoo_reference ? (
                    selectedAppt.customers.tattoo_reference.match(/\.(jpeg|jpg|gif|png|webp)$/i) || selectedAppt.customers.tattoo_reference.includes('supabase.co/storage') ? (
                      <div className="rounded-lg overflow-hidden border border-zinc-200">
                        <img 
                          src={selectedAppt.customers.tattoo_reference} 
                          alt="Tattoo Reference" 
                          className="w-full max-h-[60vh] object-contain bg-zinc-100 cursor-zoom-in hover:opacity-90 transition-opacity"
                          onClick={() => setZoomedImg(selectedAppt.customers.tattoo_reference)}
                        />
                      </div>
                    ) : (
                      <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 flex items-center justify-between">
                        <span className="text-zinc-600 truncate mr-4">{selectedAppt.customers.tattoo_reference}</span>
                        <a 
                          href={selectedAppt.customers.tattoo_reference} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-red-600 hover:text-red-700 font-medium text-sm flex-shrink-0"
                        >
                          Open Link
                        </a>
                      </div>
                    )
                  ) : (
                    <div className="bg-zinc-50 p-8 rounded-lg border border-dashed border-zinc-300 text-center text-zinc-500">
                      No reference image or link provided.
                    </div>
                  )}
                </div>
                
                {/* Contact Info (optional) */}
                {(selectedAppt.customers?.phone || selectedAppt.customers?.email) && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-2 uppercase tracking-wider">Contact Info</h3>
                    <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 space-y-1 text-sm text-zinc-700">
                      {selectedAppt.customers?.phone && <p>Phone: {selectedAppt.customers.phone}</p>}
                      {selectedAppt.customers?.email && <p>Email: {selectedAppt.customers.email}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-zinc-200 flex justify-end bg-zinc-50 rounded-b-xl">
              <button 
                onClick={() => setSelectedAppt(null)} 
                className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Zoom Modal */}
      {zoomedImg && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImg(null)}
        >
          <img 
            src={zoomedImg} 
            alt="Zoomed Reference" 
            className="max-w-full max-h-full object-contain select-none"
          />
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 p-2 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setZoomedImg(null);
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

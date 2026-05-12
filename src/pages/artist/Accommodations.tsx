import React, { useState, useEffect } from 'react';
import { getArtistAccommodations, getConventions, getConventionStatus } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { MapPin, Calendar, Hotel, Phone, Key } from 'lucide-react';
import { format } from 'date-fns';

export const ArtistAccommodations = () => {
  const { user } = useAuthStore();
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccommodations = async () => {
      try {
        const [accData, convData] = await Promise.all([
          getArtistAccommodations(user?.id || ''),
          getConventions()
        ]);
        
        const convsWithStatus = convData.map(c => ({
          ...c,
          computedStatus: getConventionStatus(c.start_date, c.end_date)
        }));
        
        const currentConvention = convsWithStatus.find(c => c.computedStatus === 'ongoing') || convsWithStatus.find(c => c.computedStatus === 'upcoming');
        
        let activeAccs = accData;
        if (currentConvention) {
          activeAccs = activeAccs.filter(a => a.convention_id === currentConvention.id);
        }

        setAccommodations(activeAccs);
      } catch (error) {
        console.error('Error fetching accommodations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchAccommodations();
    }
  }, [user]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">My Accommodations</h1>
      </div>

      {accommodations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 text-center text-zinc-500">
          You have no assigned accommodations yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {accommodations.map((acc) => (
            <div key={acc.id} className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="p-6 border-b border-zinc-100 bg-blue-50 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                  <Hotel className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">{acc.hotel_name}</h3>
                  <p className="text-sm font-medium text-blue-600 mt-1">{acc.conventions?.name}</p>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 text-zinc-600">
                  <MapPin className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Address</p>
                    <p className="text-sm">{acc.hotel_address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-zinc-600">
                  <Calendar className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Dates</p>
                    <p className="text-sm">
                      {acc.check_in_date ? format(new Date(acc.check_in_date), 'MMM d, yyyy') : 'TBA'} 
                      {' - '} 
                      {acc.check_out_date ? format(new Date(acc.check_out_date), 'MMM d, yyyy') : 'TBA'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Room</p>
                    <p className="text-sm font-medium text-zinc-900">{acc.room_number || 'TBA'}</p>
                  </div>
                  {acc.contact_phone && (
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Phone
                      </p>
                      <p className="text-sm font-medium text-zinc-900">{acc.contact_phone}</p>
                    </div>
                  )}
                  {acc.access_code && (
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider flex items-center gap-1">
                        <Key className="w-3 h-3" /> Access Code
                      </p>
                      <p className="text-sm font-bold text-red-600 tracking-wider">{acc.access_code}</p>
                    </div>
                  )}
                </div>
                
                {acc.notes && (
                  <div className="pt-2">
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-lg border border-zinc-100">{acc.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConventions, applyForConvention, getArtistBoothAssignments, getConventionStatus, cancelConventionApplication } from '../../lib/api';
import { Calendar, MapPin, Users, CheckCircle, ArrowRight, Image as ImageIcon, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/useAuthStore';

export const ArtistConventions = () => {
  const [upcomingConventions, setUpcomingConventions] = useState<any[]>([]);
  const [pastConventions, setPastConventions] = useState<any[]>([]);
  const [appliedConventions, setAppliedConventions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const [convData, assignments] = await Promise.all([
          getConventions(),
          getArtistBoothAssignments(user.id)
        ]);
        
        const upcoming = convData.filter(c => {
          const status = getConventionStatus(c.start_date, c.end_date);
          c.computedStatus = status;
          return status === 'upcoming' || status === 'ongoing';
        });
        const past = convData.filter(c => {
          const status = getConventionStatus(c.start_date, c.end_date);
          c.computedStatus = status;
          return status === 'past';
        });

        setUpcomingConventions(upcoming);
        setPastConventions(past);
        
        const appliedSet = new Set<string>();
        assignments.forEach((a: any) => appliedSet.add(a.convention_id));
        setAppliedConventions(appliedSet);
      } catch (error) {
        console.error('Error fetching conventions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

  const handleCancelApplication = async (conventionId: string) => {
    if (!user?.id) return;
    if (!window.confirm('Are you sure you want to cancel your application for this convention?')) return;
    
    try {
      await cancelConventionApplication(conventionId, user.id);
      setAppliedConventions(prev => {
        const newSet = new Set(prev);
        newSet.delete(conventionId);
        return newSet;
      });
      alert('Application cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling application:', error);
      alert('Failed to cancel application.');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">Convention Registration</h1>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Upcoming & Ongoing Conventions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingConventions.map((conv) => (
            <div key={conv.id} className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-zinc-900 pr-2">{conv.name}</h3>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize shadow-sm ${
                    conv.computedStatus === 'ongoing' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {conv.computedStatus}
                  </span>
                </div>
                
                <div className="space-y-3 text-sm text-zinc-600">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    {format(new Date(conv.start_date), 'MMM d')} - {format(new Date(conv.end_date), 'MMM d, yyyy')}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span className="line-clamp-1">{conv.location}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-400" />
                    {conv.artists_needed} Artists Needed
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-zinc-100 bg-zinc-50 mt-auto">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-zinc-900">Registration</span>
                  <span className="text-xs text-zinc-500">Open</span>
                </div>
                {appliedConventions.has(conv.id) ? (
                  <div className="flex gap-2">
                    <button disabled className="flex-1 bg-zinc-100 text-zinc-600 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-default border border-zinc-200">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Applied
                    </button>
                    {conv.computedStatus !== 'ongoing' && (
                      <button 
                        onClick={() => handleCancelApplication(conv.id)}
                        className="px-3 bg-white border border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-zinc-400 py-2 rounded-lg transition-colors flex items-center justify-center"
                        title="Cancel Application"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => handleApply(conv.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Apply for Booth
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {upcomingConventions.length === 0 && (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-zinc-200 p-8 text-center text-zinc-500">
              No upcoming conventions found.
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Past Conventions Archive</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pastConventions.map((conv) => (
            <div key={conv.id} className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col opacity-80 hover:opacity-100 hover:shadow-md transition-all">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-zinc-900 pr-2">{conv.name}</h3>
                  <span className="bg-zinc-100 text-zinc-600 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize shadow-sm">
                    {conv.computedStatus || 'past'}
                  </span>
                </div>
                <div className="space-y-3 text-sm text-zinc-600">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    {format(new Date(conv.start_date), 'MMM d, yyyy')}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span className="line-clamp-1">{conv.location}</span>
                  </p>
                </div>
              </div>
              <div className="p-4 border-t border-zinc-100 bg-zinc-50 mt-auto">
                <button 
                  onClick={() => navigate(`/artist/conventions/${conv.id}`)}
                  className="w-full bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-900 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  View My Orders & Earnings <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {pastConventions.length === 0 && (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-zinc-200 p-8 text-center text-zinc-500">
              No past conventions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

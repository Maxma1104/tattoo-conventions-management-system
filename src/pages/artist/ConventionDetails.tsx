import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConventionWithOrders } from '../../lib/api';
import { Calendar, MapPin, DollarSign, ArrowLeft, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';

export const ArtistConventionDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [convention, setConvention] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user?.id) return;
      try {
        const data = await getConventionWithOrders(id, user.id);
        setConvention(data.convention);
        setOrders(data.orders);
      } catch (error) {
        console.error('Error fetching convention details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

      const channel = supabase.channel('sync-conventiondetails')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          fetchData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [id, user]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>;
  }

  if (!convention) {
    return <div className="p-8 text-center text-zinc-500 dark:text-hermes-teal">Convention not found.</div>;
  }

  const paidOrders = orders.filter(o => o.status === 'paid');
  const artistRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) * 0.4;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/artist/conventions')}
        className="flex items-center gap-2 text-zinc-500 dark:text-hermes-teal hover:text-zinc-900 dark:text-hermes-ivory transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Conventions
      </button>

      <div className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg p-8 rounded-none shadow-sm border border-zinc-200 dark:border-hermes-teal/30">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-hermes-ivory">{convention.name}</h1>
        <div className="flex flex-wrap gap-6 mt-4 text-zinc-600 dark:text-hermes-teal">
          <p className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-zinc-400" />
            {format(new Date(convention.start_date), 'MMM d, yyyy')} - {format(new Date(convention.end_date), 'MMM d, yyyy')}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-zinc-400" />
            {convention.location} {convention.venue && `(${convention.venue})`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg p-6 rounded-none shadow-sm border border-zinc-200 dark:border-hermes-teal/30">
          <p className="text-sm text-zinc-500 dark:text-hermes-teal font-medium flex items-center gap-2 mb-2"><Package className="w-4 h-4" /> My Orders</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-hermes-ivory">{orders.length}</p>
          <p className="text-xs text-zinc-400 mt-1">{paidOrders.length} completed</p>
        </div>
        <div className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg p-6 rounded-none shadow-sm border border-zinc-200 dark:border-hermes-teal/30 bg-green-50/50 border-green-100">
          <p className="text-sm text-green-700 font-medium flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4" /> My Earnings (40%)</p>
          <p className="text-2xl font-bold text-green-700">${artistRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg rounded-none shadow-sm border border-zinc-200 dark:border-hermes-teal/30 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-hermes-teal/30 bg-zinc-50 dark:bg-hermes-darkBg">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-hermes-ivory">My Orders Archive</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-hermes-darkBg text-zinc-500 dark:text-hermes-teal text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-hermes-teal/30">
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {orders.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500 dark:text-hermes-teal">No orders assigned to you for this convention.</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50 dark:bg-hermes-darkBg">
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-hermes-ivory">
                      {order.appointments?.customers?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-hermes-teal">
                      {order.appointments?.tattoo_type}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-hermes-ivory">
                      ${order.total_amount}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${order.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                          'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConventionWithOrders, getConventionAssignments, getArtists, applyForConvention, cancelConventionApplication } from '../../lib/api';
import { Calendar, MapPin, DollarSign, ArrowLeft, Users, Package, UserPlus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export const ManagerConventionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [convention, setConvention] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [allArtists, setAllArtists] = useState<any[]>([]);
  const [selectedArtistToAdd, setSelectedArtistToAdd] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [data, assignmentsData, artistsData] = await Promise.all([
        getConventionWithOrders(id),
        getConventionAssignments(id),
        getArtists()
      ]);
      setConvention(data.convention);
      setOrders(data.orders);
      setAssignments(assignmentsData);
      setAllArtists(artistsData);
    } catch (error) {
      console.error('Error fetching convention details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddArtist = async () => {
    if (!selectedArtistToAdd || !id) return;
    try {
      await applyForConvention(id, selectedArtistToAdd);
      setSelectedArtistToAdd('');
      await fetchData();
    } catch (error) {
      console.error('Error adding artist:', error);
      alert('Failed to add artist. They might already be added.');
    }
  };

  const handleRemoveArtist = async (artistId: string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to remove this artist from the convention?')) return;
    try {
      await cancelConventionApplication(id, artistId);
      await fetchData();
    } catch (error) {
      console.error('Error removing artist:', error);
      alert('Failed to remove artist.');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>;
  }

  if (!convention) {
    return <div className="p-8 text-center text-zinc-500">Convention not found.</div>;
  }

  const paidOrders = orders.filter(o => o.status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  
  // Calculate Artist Commissions (40%)
  const totalArtistCommission = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount || 0) * 0.4), 0);

  // Calculate Fixed Costs
  const boothFee = Number(convention.booth_fee || 0);
  const accomFee = Number(convention.accommodation_fee || 0);
  const travelFee = Number(convention.travel_fee || 0);
  const foodFee = Number(convention.food_fee || 0);
  const fixedCosts = boothFee + accomFee + travelFee + foodFee;

  // Net Profit
  const netProfit = totalRevenue - totalArtistCommission - fixedCosts;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/manager/conventions')}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Conventions
      </button>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-zinc-200">
        <h1 className="text-3xl font-bold text-zinc-900">{convention.name}</h1>
        <div className="flex flex-wrap gap-6 mt-4 text-zinc-600">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 font-medium flex items-center gap-2 mb-2"><Package className="w-4 h-4" /> Total Orders</p>
          <p className="text-2xl font-bold text-zinc-900">{orders.length}</p>
          <p className="text-xs text-zinc-400 mt-1">{paidOrders.length} completed</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
          <p className="text-sm text-zinc-500 font-medium flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4" /> Total Revenue</p>
          <p className="text-2xl font-bold text-zinc-900">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className={`p-6 rounded-xl shadow-sm border ${netProfit >= 0 ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
          <p className={`text-sm font-medium flex items-center gap-2 mb-2 ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            <DollarSign className="w-4 h-4" /> Net Profit
          </p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            ${netProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Artists Assigned Section */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-500" />
            Participating Artists
          </h2>
          <div className="flex gap-2">
            <select
              value={selectedArtistToAdd}
              onChange={(e) => setSelectedArtistToAdd(e.target.value)}
              className="text-sm border border-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select Artist to Add...</option>
              {allArtists.map(artist => (
                <option key={artist.id} value={artist.id}>{artist.name}</option>
              ))}
            </select>
            <button
              onClick={handleAddArtist}
              disabled={!selectedArtistToAdd}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <UserPlus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
        <div className="p-4">
          {assignments.length === 0 ? (
            <p className="text-center text-zinc-500 py-4">No artists are currently assigned to this convention.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg bg-zinc-50">
                  <span className="font-medium text-zinc-900">{assignment.users?.name || 'Unknown Artist'}</span>
                  <button
                    onClick={() => handleRemoveArtist(assignment.artist_id)}
                    className="text-zinc-400 hover:text-red-600 transition-colors"
                    title="Remove Artist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50">
          <h2 className="text-lg font-bold text-zinc-900">Orders Archive</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-200">
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Artist</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {orders.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No orders recorded for this convention.</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-900">{order.appointments?.customers?.name || 'Unknown'}</p>
                      <p className="text-xs text-zinc-500">{order.appointments?.tattoo_type}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-700">
                      {order.users?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900">
                      ${order.total_amount}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                          'bg-orange-100 text-orange-800'}`}>
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

import React, { useState, useEffect } from 'react';
import { getConventions, getOrders, updateConvention, getConventionStatus } from '../../lib/api';
import { DollarSign, TrendingUp, Save, Users, MapPin, Building, Car, Coffee, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const ManagerFinances = () => {
  const [conventions, setConventions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [costs, setCosts] = useState({
    booth_fee: '',
    accommodation_fee: '',
    travel_fee: '',
    food_fee: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convData, ordData] = await Promise.all([
          getConventions(),
          getOrders()
        ]);
        
        const convsWithStatus = convData.map(c => ({
          ...c,
          computedStatus: getConventionStatus(c.start_date, c.end_date)
        }));
        setConventions(convsWithStatus);
        setOrders(ordData);

        // Auto-select current convention
        const currentConv = convsWithStatus.find(c => c.computedStatus === 'ongoing') || convsWithStatus.find(c => c.computedStatus === 'upcoming');
        if (currentConv) {
          setSelectedConvId(currentConv.id);
        } else if (convsWithStatus.length > 0) {
          setSelectedConvId(convsWithStatus[0].id);
        }
      } catch (error) {
        console.error('Error fetching finances data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const conv = conventions.find(c => c.id === selectedConvId);
    if (conv) {
      setCosts({
        booth_fee: conv.booth_fee?.toString() || '0',
        accommodation_fee: conv.accommodation_fee?.toString() || '0',
        travel_fee: conv.travel_fee?.toString() || '0',
        food_fee: conv.food_fee?.toString() || '0',
      });
    }
  }, [selectedConvId, conventions]);

  const handleSaveCosts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId) return;
    setIsSaving(true);
    try {
      const updateData = {
        booth_fee: parseFloat(costs.booth_fee) || 0,
        accommodation_fee: parseFloat(costs.accommodation_fee) || 0,
        travel_fee: parseFloat(costs.travel_fee) || 0,
        food_fee: parseFloat(costs.food_fee) || 0,
      };
      await updateConvention(selectedConvId, updateData);
      
      // Update local state
      setConventions(conventions.map(c => c.id === selectedConvId ? { ...c, ...updateData } : c));
      alert('Costs saved successfully');
    } catch (error) {
      console.error('Error saving costs:', error);
      alert('Failed to save costs');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculations
  const activeOrders = orders.filter(o => o.appointments?.convention_id === selectedConvId && o.status === 'paid');
  const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const artistEarnings: Record<string, { name: string, total: number, cut: number }> = {};
  activeOrders.forEach(o => {
    const artistId = o.artist_id;
    const artistName = o.users?.name || 'Unknown Artist';
    if (!artistEarnings[artistId]) {
      artistEarnings[artistId] = { name: artistName, total: 0, cut: 0 };
    }
    artistEarnings[artistId].total += Number(o.total_amount || 0);
    artistEarnings[artistId].cut = artistEarnings[artistId].total * 0.4;
  });

  const totalArtistCommission = Object.values(artistEarnings).reduce((sum, a) => sum + a.cut, 0);

  const boothFee = parseFloat(costs.booth_fee) || 0;
  const accomFee = parseFloat(costs.accommodation_fee) || 0;
  const travelFee = parseFloat(costs.travel_fee) || 0;
  const foodFee = parseFloat(costs.food_fee) || 0;

  const fixedCosts = boothFee + accomFee + travelFee + foodFee;
  const totalCosts = fixedCosts + totalArtistCommission;
  const netProfit = totalRevenue - totalCosts;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-12 h-12 animate-spin text-red-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-red-600" />
          Financial Dashboard
        </h1>
        <div className="w-64">
          <select 
            value={selectedConvId} 
            onChange={(e) => setSelectedConvId(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500 font-medium"
          >
            {conventions.length === 0 && <option value="">No Conventions Available</option>}
            {conventions.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.computedStatus})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedConvId ? (
        <div className="bg-white rounded-xl p-8 text-center text-zinc-500 border border-zinc-200">
          Please select or create a convention to view finances.
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm flex flex-col justify-center">
              <p className="text-sm font-medium text-zinc-500 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-zinc-900">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm flex flex-col justify-center">
              <p className="text-sm font-medium text-zinc-500 mb-1">Operating Costs</p>
              <p className="text-3xl font-bold text-orange-600">${fixedCosts.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm flex flex-col justify-center">
              <p className="text-sm font-medium text-zinc-500 mb-1">Artist Commissions (40%)</p>
              <p className="text-3xl font-bold text-blue-600">${totalArtistCommission.toFixed(2)}</p>
            </div>
            <div className={`rounded-xl p-6 border shadow-sm flex flex-col justify-center ${netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-sm font-medium mb-1 ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net Profit</p>
              <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ${netProfit.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Operating Costs Form */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-zinc-100 bg-zinc-50">
                <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-orange-500" />
                  Operating Costs Input
                </h2>
              </div>
              <form onSubmit={handleSaveCosts} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-zinc-400" /> Booth Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                      <input 
                        type="number" step="0.01" min="0" required
                        value={costs.booth_fee} onChange={e => setCosts({...costs, booth_fee: e.target.value})}
                        className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1 flex items-center gap-1">
                      <Building className="w-4 h-4 text-zinc-400" /> Accommodation
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                      <input 
                        type="number" step="0.01" min="0" required
                        value={costs.accommodation_fee} onChange={e => setCosts({...costs, accommodation_fee: e.target.value})}
                        className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1 flex items-center gap-1">
                      <Car className="w-4 h-4 text-zinc-400" /> Travel / Flights
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                      <input 
                        type="number" step="0.01" min="0" required
                        value={costs.travel_fee} onChange={e => setCosts({...costs, travel_fee: e.target.value})}
                        className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1 flex items-center gap-1">
                      <Coffee className="w-4 h-4 text-zinc-400" /> Food & Beverage
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                      <input 
                        type="number" step="0.01" min="0" required
                        value={costs.food_fee} onChange={e => setCosts({...costs, food_fee: e.target.value})}
                        className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-zinc-100 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Costs
                  </button>
                </div>
              </form>
            </div>

            {/* Artist Breakdown */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-zinc-100 bg-zinc-50">
                <h2 className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Artist Commissions Breakdown
                </h2>
              </div>
              <div className="p-5 flex-1 overflow-y-auto">
                {Object.values(artistEarnings).length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
                    No paid orders found for this convention.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.values(artistEarnings).map((artist, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-zinc-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                        <div>
                          <p className="font-bold text-zinc-800">{artist.name}</p>
                          <p className="text-xs text-zinc-500">Generated: ${artist.total.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-zinc-500">40% Cut</p>
                          <p className="font-bold text-blue-600">${artist.cut.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import React, { useState, useEffect } from 'react';
import { getAllAccommodations, getConventions, getArtists, createAccommodation, deleteAccommodation } from '../../lib/api';
import { parseAccommodationWithAI, parseAccommodationTextWithAI } from '../../lib/ai';
import { Hotel, Plus, Trash2, MapPin, Calendar, Sparkles, Upload, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const ManagerAccommodations = () => {
  const { t } = useTranslation();
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [conventions, setConventions] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const [formData, setFormData] = useState({
    convention_id: '',
    artist_ids: [] as string[],
    hotel_name: '',
    hotel_address: '',
    check_in_date: '',
    check_out_date: '',
    room_number: '',
    contact_phone: '',
    access_code: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [accData, convData, artistData] = await Promise.all([
        getAllAccommodations(),
        getConventions(),
        getArtists()
      ]);
      setAccommodations(accData);
      setConventions(convData);
      setArtists(artistData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

      const channel = supabase.channel('sync-accommodations')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          fetchData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, []);

  const handleAiTextAutofill = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    try {
      const parsedData = await parseAccommodationTextWithAI(aiInput);
      if (parsedData) {
        setFormData(prev => ({
          ...prev,
          hotel_name: parsedData.hotel_name || prev.hotel_name,
          hotel_address: parsedData.hotel_address || prev.hotel_address,
          check_in_date: parsedData.check_in_date || prev.check_in_date,
          check_out_date: parsedData.check_out_date || prev.check_out_date,
          room_number: parsedData.room_number || prev.room_number,
          contact_phone: parsedData.contact_phone || prev.contact_phone,
          access_code: parsedData.access_code || prev.access_code,
        }));
      }
      setAiInput('');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to parse text with AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setIsAiLoading(true);
      try {
        const parsedData = await parseAccommodationWithAI(base64String);
        if (parsedData) {
          setFormData(prev => ({
            ...prev,
            hotel_name: parsedData.hotel_name || prev.hotel_name,
            hotel_address: parsedData.hotel_address || prev.hotel_address,
            check_in_date: parsedData.check_in_date || prev.check_in_date,
            check_out_date: parsedData.check_out_date || prev.check_out_date,
            room_number: parsedData.room_number || prev.room_number,
            contact_phone: parsedData.contact_phone || prev.contact_phone,
            access_code: parsedData.access_code || prev.access_code,
          }));
        }
      } catch (error: any) {
        console.error(error);
        alert(error.message || 'Failed to parse image with AI.');
      } finally {
        setIsAiLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.artist_ids.length === 0) {
      alert('Please select at least one artist.');
      return;
    }
    
    try {
      const promises = formData.artist_ids.map(artistId => 
        createAccommodation({
          convention_id: formData.convention_id,
          artist_id: artistId,
          hotel_name: formData.hotel_name,
          hotel_address: formData.hotel_address,
          check_in_date: formData.check_in_date || null,
          check_out_date: formData.check_out_date || null,
          room_number: formData.room_number,
          contact_phone: formData.contact_phone,
          access_code: formData.access_code,
          notes: formData.notes
        })
      );
      
      await Promise.all(promises);
      
      setIsModalOpen(false);
      setFormData({
        convention_id: '', artist_ids: [], hotel_name: '', hotel_address: '',
        check_in_date: '', check_out_date: '', room_number: '', contact_phone: '',
        access_code: '', notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating accommodation:', error);
      alert('Failed to save accommodation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this accommodation record?')) return;
    try {
      await deleteAccommodation(id);
      setAccommodations(accommodations.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      alert('Failed to delete');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-hermes-ivory">Accommodations Management</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-none text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Accommodation
        </button>
      </div>

      <div className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg rounded-none shadow-sm border border-zinc-200 dark:border-hermes-teal/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-hermes-darkBg text-zinc-500 dark:text-hermes-teal text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-hermes-teal/30">
                <th className="px-6 py-4 font-medium">Artist & Convention</th>
                <th className="px-6 py-4 font-medium">Hotel Info</th>
                <th className="px-6 py-4 font-medium">Dates & Room</th>
                <th className="px-6 py-4 font-medium">Access & Contact</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {accommodations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 dark:text-hermes-teal">
                    No accommodations found
                  </td>
                </tr>
              ) : (
                accommodations.map((acc) => (
                  <tr key={acc.id} className="hover:bg-zinc-50 dark:bg-hermes-darkBg transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-900 dark:text-hermes-ivory">{acc.users?.name || 'Unknown Artist'}</p>
                      <p className="text-xs text-blue-600 font-medium mt-1">{acc.conventions?.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-hermes-ivory text-sm flex items-center gap-1">
                        <Hotel className="w-3 h-3" /> {acc.hotel_name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-hermes-teal mt-1 flex items-start gap-1">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{acc.hotel_address}</span>
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-hermes-ivoryDim">
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        {acc.check_in_date ? format(new Date(acc.check_in_date), 'MMM d') : '-'} to {acc.check_out_date ? format(new Date(acc.check_out_date), 'MMM d') : '-'}
                      </p>
                      <p className="text-xs mt-1">Room: <span className="font-medium">{acc.room_number || 'TBA'}</span></p>
                    </td>
                    <td className="px-6 py-4">
                      {acc.access_code && (
                        <p className="text-sm font-medium text-red-600">Code: {acc.access_code}</p>
                      )}
                      {acc.contact_phone && (
                        <p className="text-xs text-zinc-500 dark:text-hermes-teal mt-1">{acc.contact_phone}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(acc.id)}
                        className="text-zinc-400 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4 ml-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg rounded-none shadow-xl w-full max-w-2xl my-8 flex-shrink-0">
            <div className="p-6 border-b border-zinc-200 dark:border-hermes-teal/30">
              <h2 className="text-xl font-bold">Assign Accommodation</h2>
            </div>
            
            {/* AI Autofill Section */}
            <div className="p-6 pb-0">
              <div className="bg-zinc-50 dark:bg-hermes-darkBg border border-zinc-200 dark:border-hermes-teal/30 rounded-none p-5">
                <label className="block text-sm font-semibold text-purple-700 dark:text-hermes-ivory mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI Magic Extract (Text or Image)
                </label>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Paste hotel booking text or details here..."
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-hermes-teal/30 rounded-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={handleAiTextAutofill}
                      disabled={isAiLoading || !aiInput.trim()}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-2 rounded-none text-sm font-medium transition-colors flex items-center justify-center min-w-[80px]"
                    >
                      {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Autofill'}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 font-medium">OR</span>
                    <div className="flex-1 border-t border-blue-200"></div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <label className="cursor-pointer hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg border border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 px-4 py-2.5 rounded-none text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                      {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {isAiLoading ? 'Analyzing Screenshot...' : 'Upload Screenshot'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isAiLoading} />
                    </label>
                    <p className="text-xs text-blue-600/70 max-w-sm">
                      Upload a screenshot of the hotel booking (Airbnb, Booking.com, etc.) to instantly auto-fill the form details below.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">Convention *</label>
                  <select required value={formData.convention_id} onChange={e => setFormData({...formData, convention_id: e.target.value})} className="w-full px-3 py-2 border rounded-none focus:ring-red-500">
                    <option value="">Select Convention...</option>
                    {conventions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">Artists *</label>
                  <div className="w-full px-3 py-2 border rounded-none max-h-[104px] overflow-y-auto space-y-2 hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg">
                    {artists.map(a => (
                      <label key={a.id} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 dark:bg-hermes-darkBg rounded p-1">
                        <input 
                          type="checkbox" 
                          checked={formData.artist_ids.includes(a.id)}
                          onChange={(e) => {
                            const newIds = e.target.checked 
                              ? [...formData.artist_ids, a.id] 
                              : formData.artist_ids.filter(id => id !== a.id);
                            setFormData({...formData, artist_ids: newIds});
                          }}
                          className="rounded border-zinc-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-zinc-700 dark:text-hermes-ivoryDim">{a.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">Hotel Name *</label>
                <input required type="text" value={formData.hotel_name} onChange={e => setFormData({...formData, hotel_name: e.target.value})} className="w-full px-3 py-2 border rounded-none focus:ring-red-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">Hotel Address *</label>
                <textarea required rows={2} value={formData.hotel_address} onChange={e => setFormData({...formData, hotel_address: e.target.value})} className="w-full px-3 py-2 border rounded-none focus:ring-red-500"></textarea>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">{t("accommodations.checkIn")}</label>
                  <input type="date" value={formData.check_in_date} onChange={e => setFormData({...formData, check_in_date: e.target.value})} className="w-full px-3 py-2 border rounded-none focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">{t("accommodations.checkOut")}</label>
                  <input type="date" value={formData.check_out_date} onChange={e => setFormData({...formData, check_out_date: e.target.value})} className="w-full px-3 py-2 border rounded-none focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">Room Number</label>
                  <input type="text" value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} className="w-full px-3 py-2 border rounded-none focus:ring-red-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">Contact Phone</label>
                  <input type="tel" value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} className="w-full px-3 py-2 border rounded-none focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">Access Code / Password</label>
                  <input type="text" value={formData.access_code} onChange={e => setFormData({...formData, access_code: e.target.value})} className="w-full px-3 py-2 border rounded-none focus:ring-red-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">Additional Notes</label>
                <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border rounded-none focus:ring-red-500"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-zinc-600 dark:text-hermes-teal hover:bg-zinc-100 dark:bg-hermes-teal/10 rounded-none">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none font-medium">Save Accommodation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
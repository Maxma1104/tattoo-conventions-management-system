import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConventions, createConvention, updateConvention, deleteConvention, getConventionStatus, uploadReferenceImage } from '../../lib/api';
import { parseConventionWithAI, parseConventionWithAIVision } from '../../lib/ai';
import { Plus, Calendar, MapPin, Users, Sparkles, Loader2, ArrowRight, Trash2, Edit2, Upload, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';

export const ManagerConventions = () => {
  const { t } = useTranslation();
  const [conventions, setConventions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    location: '',
    venue: '',
    total_booths: 1,
    artists_needed: 1,
    image_url: '',
  });

  const fetchConventions = async () => {
    try {
      const data = await getConventions();
      // Sort conventions by start_date (late to early)
      data.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      setConventions(data);
    } catch (error) {
      console.error('Error fetching conventions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiAutofill = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    try {
      const parsedData = await parseConventionWithAI(aiInput);
      if (parsedData) {
        setFormData(prev => ({
          ...prev,
          name: parsedData.name || prev.name,
          start_date: parsedData.start_date || prev.start_date,
          end_date: parsedData.end_date || prev.end_date,
          location: parsedData.location || prev.location,
          venue: parsedData.venue || prev.venue,
        }));
      }
      setAiInput(''); // Clear input after successful parse
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to parse with AI. Please check your configuration.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleImageUploadAndParse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setIsAiLoading(true);

    try {
      // 1. Upload image to Supabase to get the URL
      const imageUrl = await uploadReferenceImage(file);
      setFormData(prev => ({ ...prev, image_url: imageUrl }));

      // 2. Read file as base64 for AI parsing
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const parsedData = await parseConventionWithAIVision(base64String);
          if (parsedData) {
            setFormData(prev => ({
              ...prev,
              name: parsedData.name || prev.name,
              start_date: parsedData.start_date || prev.start_date,
              end_date: parsedData.end_date || prev.end_date,
              location: parsedData.location || prev.location,
              venue: parsedData.venue || prev.venue,
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

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    fetchConventions();

      const channel = supabase.channel('sync-conventions')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          fetchConventions();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingConvId) {
        await updateConvention(editingConvId, {
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          location: formData.location,
          venue: formData.venue,
          total_booths: formData.total_booths,
          artists_needed: formData.artists_needed,
        });
      } else {
        await createConvention({
          ...formData,
          created_by: user?.id,
          status: 'upcoming'
        });
      }
      setIsModalOpen(false);
      setEditingConvId(null);
      setFormData({
        name: '',
        start_date: '',
        end_date: '',
        location: '',
        venue: '',
        total_booths: 1,
        artists_needed: 1,
        image_url: '',
      });
      fetchConventions();
    } catch (error) {
      console.error('Error saving convention:', error);
      alert('Failed to save convention');
    }
  };

  const handleEditClick = (e: React.MouseEvent, conv: any) => {
    e.stopPropagation();
    setFormData({
      name: conv.name,
      start_date: conv.start_date,
      end_date: conv.end_date,
      location: conv.location,
      venue: conv.venue || '',
      total_booths: conv.total_booths,
      artists_needed: conv.artists_needed,
      image_url: conv.image_url || '',
    });
    setEditingConvId(conv.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent navigating to details page
    if (!window.confirm('Are you sure you want to delete this convention? This will delete all associated orders, appointments, and accommodations.')) return;
    try {
      await deleteConvention(id);
      setConventions(conventions.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting convention:', error);
      alert('Failed to delete convention');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-hermes-ivory">Convention Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-none text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Convention
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conventions.map((conv) => {
            const computedStatus = getConventionStatus(conv.start_date, conv.end_date);
            return (
            <div key={conv.id} className={`hermes-card rounded-none shadow-sm border border-zinc-200 dark:border-hermes-teal/30 overflow-hidden flex flex-col hover:shadow-md transition-shadow ${computedStatus === 'past' ? 'opacity-80' : ''}`}>
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-hermes-ivory pr-2">{conv.name}</h3>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize shadow-sm ${
                    computedStatus === 'past' 
                      ? 'bg-zinc-100 dark:bg-hermes-teal/10 text-zinc-600 dark:text-hermes-teal' 
                      : computedStatus === 'ongoing' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {computedStatus}
                  </span>
                </div>
                
                <div className="space-y-3 text-sm text-zinc-600 dark:text-hermes-teal">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    {format(new Date(conv.start_date), 'MMM d')} - {format(new Date(conv.end_date), 'MMM d, yyyy')}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span className="line-clamp-1">{conv.location} {conv.venue && `(${conv.venue})`}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-400" />
                    {conv.artists_needed} Artists Needed
                  </p>
                </div>
              </div>
              
              <div className="p-4 border-t border-zinc-100 dark:border-hermes-teal/30 bg-zinc-50 dark:bg-hermes-darkBg mt-auto flex gap-2">
                <button 
                  onClick={() => navigate(`/manager/conventions/${conv.id}`)}
                  className="flex-1 hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg border border-zinc-300 hover:bg-zinc-50 dark:bg-hermes-darkBg text-zinc-900 dark:text-hermes-ivory py-2 rounded-none text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  View Archive <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => handleEditClick(e, conv)}
                  className="px-3 hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg border border-zinc-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-zinc-400 py-2 rounded-none transition-colors flex items-center justify-center"
                  title="Edit Convention"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="px-3 hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg border border-zinc-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-zinc-400 py-2 rounded-none transition-colors flex items-center justify-center"
                  title="Delete Convention"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )})}
        </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg rounded-none shadow-xl max-w-md w-full p-6 my-8 flex-shrink-0">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-hermes-ivory mb-4">{editingConvId ? 'Edit Convention' : 'Add New Convention'}</h2>
            
            {/* AI Autofill Section */}
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-hermes-darkBg border border-zinc-200 dark:border-hermes-teal/30 rounded-none">
              <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                AI Magic Autofill (Text or Image)
              </label>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Paste convention website text or details here..."
                    className="w-full px-3 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleAiAutofill}
                    disabled={isAiLoading || !aiInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-2 rounded-none text-sm font-medium transition-colors flex items-center justify-center min-w-[80px]"
                  >
                    {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Autofill'}
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-medium">OR</span>
                  <div className="flex-1 border-t border-zinc-200 dark:border-hermes-teal/30"></div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="cursor-pointer hermes-card bg-white/20 dark:bg-hermes-darkBg/30 backdrop-blur-md border border-white/30 dark:border-hermes-teal/30 shadow-lg border border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-700 px-4 py-2 rounded-none text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
                    {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isAiLoading ? 'Analyzing Image...' : 'Upload Convention Poster / Screenshot'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUploadAndParse} disabled={isAiLoading} />
                  </label>
                  {formData.image_url && (
                    <div className="flex items-center gap-2 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                      <ImageIcon className="w-3 h-3" />
                      Image Attached
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">{t("conventions.name")}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">{t("conventions.startDate")}</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">{t("conventions.endDate")}</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">Location (City, Country)</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">Venue</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">Total Booths</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.total_booths}
                    onChange={(e) => setFormData({...formData, total_booths: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-hermes-ivoryDim mb-1">{t("conventions.artistsNeeded")}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.artists_needed}
                    onChange={(e) => setFormData({...formData, artists_needed: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingConvId(null);
                  }}
                  className="px-4 py-2 text-zinc-600 dark:text-hermes-teal hover:text-zinc-900 dark:text-hermes-ivory font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-none hover:bg-red-700 font-medium text-sm transition-colors"
                >
                  {editingConvId ? 'Save Changes' : 'Create Convention'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

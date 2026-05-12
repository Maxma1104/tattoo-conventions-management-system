import React, { useState, useEffect } from 'react';
import { getOrders, createFullOrder, updateFullOrder, getArtists, getConventions, deleteOrder, updateOrderStatus, uploadReferenceImage, getConventionStatus } from '../../lib/api';
import { DollarSign, Search, Filter, X, Plus, Trash2, Edit2, Upload, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const ManagerOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [conventions, setConventions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingApptId, setEditingApptId] = useState<string | null>(null);
  const [editingCustId, setEditingCustId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tattooType: 'Custom Design',
    tattooDescription: '',
    tattooReference: '',
    totalAmount: '',
    depositAmount: '',
    artistId: '',
    conventionId: '',
    appointmentTime: '',
    orderStatus: 'pending',
  });

  const fetchData = async () => {
    try {
      const [ordersData, artistsData, conventionsData] = await Promise.all([
        getOrders(),
        getArtists(),
        getConventions()
      ]);
      
      const convsWithStatus = conventionsData.map(c => ({
        ...c,
        computedStatus: getConventionStatus(c.start_date, c.end_date)
      }));
      
      const currentConvention = convsWithStatus.find(c => c.computedStatus === 'ongoing') || convsWithStatus.find(c => c.computedStatus === 'upcoming');
      
      const activeOrds = currentConvention
        ? ordersData.filter(o => o.appointments?.convention_id === currentConvention.id)
        : [];

      setOrders(activeOrds);
      setArtists(artistsData);
      setConventions(conventionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadReferenceImage(file);
      setFormData(prev => ({ ...prev, tattooReference: url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount) || 0,
        depositAmount: parseFloat(formData.depositAmount) || 0,
      };

      if (editingOrderId) {
        await updateFullOrder(editingOrderId, {
          ...submitData,
          appointmentId: editingApptId,
          customerId: editingCustId
        });
      } else {
        await createFullOrder(submitData);
      }
      
      setIsModalOpen(false);
      setEditingOrderId(null);
      setEditingApptId(null);
      setEditingCustId(null);

      // Refresh orders
      await fetchData();
      // Reset form
      setFormData({
        customerName: '', customerPhone: '', customerEmail: '',
        tattooType: 'Custom Design', tattooDescription: '', tattooReference: '',
        totalAmount: '', depositAmount: '', artistId: '', conventionId: '',
        appointmentTime: '', orderStatus: 'pending'
      });
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order');
    }
  };

  const handleEditClick = (order: any) => {
    const appt = order.appointments;
    const cust = appt?.customers;
    
    // Convert UTC to local datetime-local format
    let localApptTime = '';
    if (appt?.appointment_time) {
      const date = new Date(appt.appointment_time);
      localApptTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    }

    setFormData({
      customerName: cust?.name || '',
      customerPhone: cust?.phone || '',
      customerEmail: cust?.email || '',
      tattooType: appt?.tattoo_type || 'Custom Design',
      tattooDescription: cust?.tattoo_description || '',
      tattooReference: cust?.tattoo_reference || '',
      totalAmount: order.total_amount || '',
      depositAmount: order.deposit_amount || '',
      artistId: order.artist_id || '',
      conventionId: appt?.convention_id || '',
      appointmentTime: localApptTime,
      orderStatus: order.status || 'pending',
    });
    setEditingOrderId(order.id);
    setEditingApptId(appt?.id);
    setEditingCustId(cust?.id);
    setIsModalOpen(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order and its associated appointment?')) return;
    try {
      await deleteOrder(orderId);
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update status');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">Order Management</h1>
        <button 
          onClick={() => {
            setEditingOrderId(null);
            setEditingApptId(null);
            setEditingCustId(null);
            setFormData({
              customerName: '', customerPhone: '', customerEmail: '',
              tattooType: 'Custom Design', tattooDescription: '', tattooReference: '',
              totalAmount: '', depositAmount: '', artistId: '', conventionId: '',
              appointmentTime: '', orderStatus: 'pending'
            });
            setIsModalOpen(true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        {/* Table code omitted for brevity in replacement, but we just insert the modal below */}
        <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
          <div className="relative">
            <Search className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search orders..." 
              className="pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-100 text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-200">
                <th className="px-6 py-4 font-medium">Order ID / Date</th>
                <th className="px-6 py-4 font-medium">Customer & Tattoo</th>
                <th className="px-6 py-4 font-medium">Artist</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 text-sm truncate w-24" title={order.id}>{order.id.split('-')[0]}</p>
                      <p className="text-xs text-zinc-500">{format(new Date(order.created_at), 'MMM d, yyyy')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-800 text-sm">{order.appointments?.customers?.name || 'Unknown'}</p>
                      <p className="text-xs text-zinc-500">{order.appointments?.tattoo_type || 'Custom Design'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700">
                      {order.users?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-900 flex items-center">
                        <DollarSign className="w-3 h-3" />
                        {order.total_amount}
                      </p>
                      <p className="text-xs text-zinc-500">Dep: ${order.deposit_amount}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer
                        ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          order.status === 'deposit_paid' ? 'bg-blue-100 text-blue-800' : 
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                          'bg-orange-100 text-orange-800'}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="deposit_paid">Deposit Paid</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button 
                        onClick={() => handleEditClick(order)}
                        className="text-zinc-400 hover:text-blue-600 transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-zinc-400 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">{editingOrderId ? 'Edit Order & Appointment' : 'Create New Order & Appointment'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-800">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrder} className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-zinc-800 border-b pb-2">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Name *</label>
                    <input required type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Phone</label>
                    <input type="tel" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                    <input type="email" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500" />
                  </div>
                </div>
              </div>

              {/* Tattoo Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-zinc-800 border-b pb-2">Tattoo Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Tattoo Type</label>
                    <select value={formData.tattooType} onChange={e => setFormData({...formData, tattooType: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500">
                      <option value="Custom Design">Custom Design</option>
                      <option value="Flash">Flash</option>
                      <option value="Cover Up">Cover Up</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Reference Image / Link</label>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        value={formData.tattooReference} 
                        onChange={e => setFormData({...formData, tattooReference: e.target.value})} 
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-red-500" 
                        placeholder="http://... or upload ->" 
                      />
                      <label className="cursor-pointer flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg px-3 transition-colors">
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-zinc-500" /> : <Upload className="w-5 h-5 text-zinc-600" />}
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                      </label>
                    </div>
                    {formData.tattooReference && formData.tattooReference.match(/\.(jpeg|jpg|gif|png|webp)$/i) && (
                      <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Image attached successfully
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                    <textarea rows={3} value={formData.tattooDescription} onChange={e => setFormData({...formData, tattooDescription: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500"></textarea>
                  </div>
                </div>
              </div>

              {/* Assignment & Order Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-zinc-800 border-b pb-2">Assignment & Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Convention (Optional)</label>
                    <select value={formData.conventionId} onChange={e => setFormData({...formData, conventionId: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500">
                      <option value="">None / Studio</option>
                      {conventions.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Artist</label>
                    <select value={formData.artistId} onChange={e => setFormData({...formData, artistId: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500">
                      <option value="">Unassigned</option>
                      {artists.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Appointment Time</label>
                    <input type="datetime-local" value={formData.appointmentTime} onChange={e => setFormData({...formData, appointmentTime: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Total Amount ($) *</label>
                    <input required type="number" step="0.01" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Deposit Paid ($)</label>
                    <input type="number" step="0.01" value={formData.depositAmount} onChange={e => setFormData({...formData, depositAmount: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">{editingOrderId ? 'Update Order' : 'Create Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

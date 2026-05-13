import { supabase } from './supabase';

export const getConventionStatus = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  const now = new Date();
  
  if (now < start) return 'upcoming';
  if (now > end) return 'past';
  return 'ongoing';
};

export const getConventions = async () => {
  const { data, error } = await supabase
    .from('conventions')
    .select('*')
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data;
};

export const applyForConvention = async (conventionId: string, artistId: string) => {
  const { data, error } = await supabase
    .from('booth_assignments')
    .insert([{
      convention_id: conventionId,
      artist_id: artistId,
      status: 'assigned'
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getArtistBoothAssignments = async (artistId: string) => {
  const { data, error } = await supabase
    .from('booth_assignments')
    .select(`
      *,
      conventions (*)
    `)
    .eq('artist_id', artistId);
  if (error) throw error;
  return data;
};

export const getConventionAssignments = async (conventionId: string) => {
  const { data, error } = await supabase
    .from('booth_assignments')
    .select(`
      *,
      users (*)
    `)
    .eq('convention_id', conventionId);
  if (error) throw error;
  return data;
};

export const cancelConventionApplication = async (conventionId: string, artistId: string) => {
  const { error } = await supabase
    .from('booth_assignments')
    .delete()
    .eq('convention_id', conventionId)
    .eq('artist_id', artistId);
  if (error) throw error;
  return true;
};

export const getAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customers (name, phone, tattoo_reference, tattoo_description),
      conventions (name, location),
      users (name)
    `)
    .order('appointment_time', { ascending: true });
  if (error) throw error;
  return data;
};

export const getConventionWithOrders = async (conventionId: string, artistId?: string) => {
  const { data: convention, error: convError } = await supabase
    .from('conventions')
    .select('*')
    .eq('id', conventionId)
    .single();
  
  if (convError) throw convError;

  let query = supabase
    .from('orders')
    .select(`
      *,
      appointments!inner (
        convention_id,
        tattoo_type,
        customers (name)
      ),
      users (name)
    `)
    .eq('appointments.convention_id', conventionId);

  if (artistId) {
    query = query.eq('artist_id', artistId);
  }

  const { data: orders, error: ordersError } = await query;
  if (ordersError) throw ordersError;

  return { convention, orders };
};

export const getOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      appointments (
        id,
        status,
        tattoo_type,
        convention_id,
        appointment_time,
        customer_id,
        customers (
          id,
          name,
          phone,
          email,
          tattoo_reference,
          tattoo_description
        )
      ),
      users (name)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const updateFullOrder = async (orderId: string, orderData: any) => {
  // Update order
  const { error: orderError } = await supabase.from('orders').update({
    artist_id: orderData.artistId || null,
    total_amount: orderData.totalAmount,
    deposit_amount: orderData.depositAmount,
    remaining_amount: orderData.totalAmount - (orderData.depositAmount || 0),
    design_description: orderData.tattooDescription,
    status: orderData.orderStatus
  }).eq('id', orderId);
  if (orderError) throw orderError;

  // Update appointment
  if (orderData.appointmentId) {
    const { error: apptError } = await supabase.from('appointments').update({
      convention_id: orderData.conventionId || null,
      artist_id: orderData.artistId || null,
      appointment_time: orderData.appointmentTime,
      tattoo_type: orderData.tattooType
    }).eq('id', orderData.appointmentId);
    if (apptError) throw apptError;
  }

  // Update customer
  if (orderData.customerId) {
    const { error: custError } = await supabase.from('customers').update({
      name: orderData.customerName,
      phone: orderData.customerPhone,
      email: orderData.customerEmail,
      tattoo_reference: orderData.tattooReference,
      tattoo_description: orderData.tattooDescription
    }).eq('id', orderData.customerId);
    if (custError) throw custError;
  }
};

export const deleteOrder = async (orderId: string) => {
  // Get appointment id to delete it as well, or cascade
  const { data: order } = await supabase.from('orders').select('appointment_id').eq('id', orderId).single();
  
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) throw error;
  
  if (order?.appointment_id) {
    await supabase.from('appointments').delete().eq('id', order.appointment_id);
  }
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAppointmentStatus = async (appointmentId: string, status: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .select()
    .single();
  if (error) throw error;

  // Sync order status automatically when appointment is completed
  if (status === 'completed') {
    await supabase.from('orders').update({ status: 'paid' }).eq('appointment_id', appointmentId);
  }

  return data;
};

export const getAllAccommodations = async () => {
  const { data, error } = await supabase
    .from('accommodations')
    .select(`
      *,
      conventions (name),
      users (name)
    `)
    .order('check_in_date', { ascending: false });
  if (error) throw error;
  return data;
};

export const createAccommodation = async (accData: any) => {
  const { data, error } = await supabase
    .from('accommodations')
    .insert([accData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteAccommodation = async (id: string) => {
  const { error } = await supabase.from('accommodations').delete().eq('id', id);
  if (error) throw error;
};

export const getArtistAccommodations = async (artistId: string) => {
  const { data, error } = await supabase
    .from('accommodations')
    .select(`
      *,
      conventions (name)
    `)
    .eq('artist_id', artistId);
  if (error) throw error;
  return data;
};

export const uploadReferenceImage = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `references/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('tattoo-references')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('tattoo-references')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const getArtists = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('role', 'artist');
  if (error) throw error;
  return data;
};

export const createConvention = async (conventionData: any) => {
  const { data, error } = await supabase
    .from('conventions')
    .insert([conventionData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateConvention = async (id: string, conventionData: any) => {
  const { data, error } = await supabase
    .from('conventions')
    .update(conventionData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteConvention = async (id: string) => {
  const { error } = await supabase
    .from('conventions')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

export const createFullOrder = async (orderData: any) => {
  // 1. Create customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert([{
      name: orderData.customerName,
      phone: orderData.customerPhone,
      email: orderData.customerEmail,
      tattoo_reference: orderData.tattooReference,
      tattoo_description: orderData.tattooDescription
    }])
    .select().single();
  if (customerError) throw customerError;

  // 2. Create appointment
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .insert([{
      customer_id: customer.id,
      convention_id: orderData.conventionId || null,
      artist_id: orderData.artistId || null,
      appointment_time: orderData.appointmentTime || new Date().toISOString(),
      duration_hours: orderData.durationHours || 1,
      tattoo_type: orderData.tattooType || 'Custom',
      status: orderData.appointmentStatus || 'pending'
    }])
    .select().single();
  if (apptError) throw apptError;

  // 3. Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      appointment_id: appointment.id,
      artist_id: orderData.artistId || null,
      total_amount: orderData.totalAmount,
      deposit_amount: orderData.depositAmount,
      remaining_amount: orderData.totalAmount - (orderData.depositAmount || 0),
      design_description: orderData.tattooDescription,
      status: orderData.orderStatus || 'pending'
    }])
    .select().single();
  if (orderError) throw orderError;

  return order;
};

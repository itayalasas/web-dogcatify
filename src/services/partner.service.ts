import { supabase } from '../lib/supabase';
import { Booking, PartnerService, PartnerProduct, ServiceReview } from './admin.service';

const IVA_RATE = 22;

async function generatePartnerBreakdown(booking: Booking) {
  const servicePrice = booking.total_amount || 0;
  const ivaAmount = (servicePrice * IVA_RATE) / 100;
  const commissionPercentage = booking.commission_percentage || 5;
  const commissionAmount = (servicePrice * commissionPercentage) / 100;

  const { data: partnerFiscalData } = await supabase
    .from('partners')
    .select('rut, email, phone, address')
    .eq('id', booking.partner_id)
    .maybeSingle();

  return {
    iva_rate: IVA_RATE,
    partners: {
      [booking.partner_id]: {
        partner_id: booking.partner_id,
        partner_name: booking.partner_name || 'Partner',
        partner_rut: partnerFiscalData?.rut || null,
        partner_email: partnerFiscalData?.email || null,
        partner_phone: partnerFiscalData?.phone || null,
        partner_address: partnerFiscalData?.address || null,
        items: [
          {
            id: booking.service_id || booking.id,
            name: booking.service_name || 'Servicio',
            price: servicePrice,
            total: servicePrice,
            quantity: 1,
            subtotal: servicePrice,
            iva_amount: ivaAmount,
          },
        ],
        subtotal: servicePrice,
      },
    },
    iva_amount: ivaAmount,
    iva_included: false,
    shipping_cost: 0,
    total_partners: 1,
    commission_split: commissionAmount,
  };
}

async function createOrUpdateOrder(booking: Booking & { payment_preference_id?: string; notes?: string; payment_data?: any }) {
  const partnerBreakdown = await generatePartnerBreakdown(booking);
  const commissionPercentage = booking.commission_percentage || 5;
  const commissionAmount = (booking.total_amount * commissionPercentage) / 100;
  const partnerAmount = booking.total_amount - commissionAmount;
  const ivaAmount = (booking.total_amount * IVA_RATE) / 100;

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('booking_id', booking.id)
    .maybeSingle();

  const completeItems = [
    {
      id: booking.service_id || booking.id,
      name: booking.service_name || 'Servicio',
      type: 'service',
      price: booking.total_amount,
      currency: 'UYU',
      currency_code_dgi: '858',
      iva_rate: IVA_RATE,
      quantity: 1,
      subtotal: booking.total_amount,
      iva_amount: ivaAmount,
      partnerId: booking.partner_id,
      partnerName: booking.partner_name || 'Partner',
      partner_name: booking.partner_name || 'Partner',
      original_price: booking.total_amount,
      discount_percentage: 0,
    },
  ];

  if (existingOrder) {
    const { error } = await supabase
      .from('orders')
      .update({
        partner_breakdown: partnerBreakdown,
        status: 'confirmed',
        commission_amount: commissionAmount,
        partner_amount: partnerAmount,
        items: completeItems,
        updated_at: new Date().toISOString(),
      })
      .eq('booking_id', booking.id);

    if (error) throw error;
  } else {
    const { error } = await supabase.from('orders').insert({
      partner_id: booking.partner_id,
      customer_id: booking.customer_id,
      booking_id: booking.id,
      order_type: 'service_booking',
      service_id: booking.service_id,
      pet_id: booking.pet_id,
      status: 'confirmed',
      total_amount: booking.total_amount,
      subtotal: booking.total_amount,
      iva_rate: IVA_RATE,
      iva_amount: ivaAmount,
      iva_included_in_price: false,
      shipping_cost: 0,
      commission_amount: commissionAmount,
      partner_amount: partnerAmount,
      partner_breakdown: partnerBreakdown,
      partner_name: booking.partner_name,
      service_name: booking.service_name,
      pet_name: booking.pet_name,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone,
      appointment_date: booking.date,
      appointment_time: booking.time,
      payment_method: booking.payment_method || 'pending',
      payment_status: booking.payment_status || 'pending',
      payment_preference_id: booking.payment_preference_id || null,
      payment_data: booking.payment_data || null,
      booking_notes: booking.notes || null,
      items: completeItems,
    });

    if (error) throw error;
  }
}

export const partnerBookingsService = {
  async getMyBookings(partnerId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('partner_id', partnerId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data as Booking[];
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (status === 'confirmed' && data) {
      const { data: partnerData } = await supabase
        .from('partners')
        .select('commission_percentage')
        .eq('id', data.partner_id)
        .maybeSingle();

      const bookingWithCommission = {
        ...data,
        commission_percentage: partnerData?.commission_percentage || 5,
        payment_preference_id: data.payment_preference_id,
        notes: data.notes,
        payment_data: data.payment_data,
      };

      await createOrUpdateOrder(bookingWithCommission);
    }

    return data as Booking;
  },
};

export const partnerServicesService = {
  async getMyServices(partnerId: string) {
    const { data, error } = await supabase
      .from('partner_services')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PartnerService[];
  },

  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('partner_services')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as PartnerService;
  }
};

export const partnerProductsService = {
  async getMyProducts(partnerId: string) {
    const { data, error } = await supabase
      .from('partner_products')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PartnerProduct[];
  },

  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('partner_products')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as PartnerProduct;
  }
};

export const partnerReviewsService = {
  async getMyReviews(partnerId: string) {
    const { data, error } = await supabase
      .from('service_reviews')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ServiceReview[];
  },

  async getStats(partnerId: string) {
    const { data, error } = await supabase
      .from('service_reviews')
      .select('rating')
      .eq('partner_id', partnerId);

    if (error) throw error;

    const total = data?.length || 0;
    const avgRating = total > 0
      ? data.reduce((acc, r) => acc + r.rating, 0) / total
      : 0;

    return { total, avgRating: avgRating.toFixed(1) };
  }
};

export const partnerOrdersService = {
  async getMyOrders(partnerId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

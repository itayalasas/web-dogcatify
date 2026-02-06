import { supabase } from '../lib/supabase';
import { Booking, PartnerService, PartnerProduct, ServiceReview } from './admin.service';

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
    return data as Booking;
  }
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

import { supabase } from '../lib/supabase';

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string;
  discount_percentage: number | null;
  is_active: boolean | null;
  partner_id: string | null;
  cta_text: string | null;
  views: number | null;
  clicks: number | null;
  created_at: string | null;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string | null;
  rating: number | null;
  description: string;
  pet_amenities: string[] | null;
  image_url: string | null;
  images: string[] | null;
  coordinates: { latitude: number; longitude: number } | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface Partner {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  is_active: boolean | null;
  is_verified: boolean | null;
  rating: number | null;
  reviews_count: number | null;
  commission_percentage: number | null;
  mercadopago_connected: boolean | null;
  created_at: string | null;
}

export interface AdminSettings {
  id: string;
  key: string;
  value: any;
  updated_at: string | null;
}

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  photo_url: string | null;
  is_owner: boolean | null;
  is_partner: boolean | null;
  phone: string | null;
  location: string | null;
  created_at: string | null;
  email_confirmed: boolean | null;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number | null;
  gender: string | null;
  weight: number | null;
  photo_url: string | null;
  owner_id: string;
  is_neutered: boolean | null;
  has_chip: boolean | null;
  chip_number: string | null;
  created_at: string | null;
}

export interface Order {
  id: string;
  partner_id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  payment_status: string | null;
  payment_method: string | null;
  partner_name: string | null;
  customer_name: string | null;
  customer_email: string | null;
  order_number: string | null;
  created_at: string | null;
}

export interface Booking {
  id: string;
  partner_id: string;
  service_id: string | null;
  service_name: string | null;
  partner_name: string | null;
  customer_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  pet_id: string | null;
  pet_name: string | null;
  date: string;
  time: string | null;
  status: string;
  total_amount: number;
  payment_status: string | null;
  created_at: string | null;
}

export interface PartnerProduct {
  id: string;
  partner_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  stock: number | null;
  is_active: boolean | null;
  images: string[] | null;
  partner_name: string | null;
  created_at: string | null;
}

export interface PartnerService {
  id: string;
  partner_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  duration: number | null;
  is_active: boolean | null;
  images: string[] | null;
  created_at: string | null;
}

export interface ServiceReview {
  id: string;
  booking_id: string;
  partner_id: string;
  service_id: string | null;
  customer_id: string;
  pet_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string | null;
}

export const promotionsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Promotion[];
  },

  async create(promotion: Partial<Promotion>) {
    const { data, error } = await supabase
      .from('promotions')
      .insert([promotion])
      .select()
      .single();

    if (error) throw error;
    return data as Promotion;
  },

  async update(id: string, updates: Partial<Promotion>) {
    const { data, error } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Promotion;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleActive(id: string, isActive: boolean) {
    return this.update(id, { is_active: isActive });
  }
};

export const placesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Place[];
  },

  async create(place: Partial<Place>) {
    const { data, error } = await supabase
      .from('places')
      .insert([place])
      .select()
      .single();

    if (error) throw error;
    return data as Place;
  },

  async update(id: string, updates: Partial<Place>) {
    const { data, error } = await supabase
      .from('places')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Place;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export const partnersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Partner[];
  },

  async updateCommission(id: string, commissionPercentage: number) {
    const { data, error } = await supabase
      .from('partners')
      .update({ commission_percentage: commissionPercentage })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Partner;
  },

  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('partners')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Partner;
  },

  async toggleVerified(id: string, isVerified: boolean) {
    const { data, error } = await supabase
      .from('partners')
      .update({ is_verified: isVerified })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Partner;
  }
};

export const settingsService = {
  async get(key: string) {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;
    return data as AdminSettings | null;
  },

  async set(key: string, value: any) {
    const { data, error } = await supabase
      .from('admin_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return data as AdminSettings;
  },

  async getAll() {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .order('key');

    if (error) throw error;
    return data as AdminSettings[];
  }
};

export const usersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as User[];
  },

  async getStats() {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_owner, is_partner, email_confirmed');

    if (error) throw error;

    const total = data?.length || 0;
    const owners = data?.filter(u => u.is_owner).length || 0;
    const partners = data?.filter(u => u.is_partner).length || 0;
    const confirmed = data?.filter(u => u.email_confirmed).length || 0;

    return { total, owners, partners, confirmed };
  }
};

export const petsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Pet[];
  },

  async getStats() {
    const { data, error } = await supabase
      .from('pets')
      .select('species');

    if (error) throw error;

    const total = data?.length || 0;
    const dogs = data?.filter(p => p.species === 'dog').length || 0;
    const cats = data?.filter(p => p.species === 'cat').length || 0;
    const others = total - dogs - cats;

    return { total, dogs, cats, others };
  }
};

export const ordersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Order[];
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  }
};

export const bookingsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Booking[];
  },

  async getByPartner(partnerId: string) {
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

export const productsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('partner_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PartnerProduct[];
  },

  async getByPartner(partnerId: string) {
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

export const servicesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('partner_services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PartnerService[];
  },

  async getByPartner(partnerId: string) {
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

export const reviewsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('service_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ServiceReview[];
  },

  async getByPartner(partnerId: string) {
    const { data, error } = await supabase
      .from('service_reviews')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ServiceReview[];
  }
};

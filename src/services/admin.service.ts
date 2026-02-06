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

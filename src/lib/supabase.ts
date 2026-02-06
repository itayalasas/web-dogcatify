import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  photo_url: string | null;
  is_owner: boolean | null;
  is_partner: boolean | null;
  location: string | null;
  bio: string | null;
  phone: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type UserRole = 'admin' | 'partner' | 'owner' | null;

export const getUserRole = (email: string, profile: Profile | null): UserRole => {
  if (email === 'admin@dogcatify.com') {
    return 'admin';
  }
  if (profile?.is_partner) {
    return 'partner';
  }
  if (profile?.is_owner) {
    return 'owner';
  }
  return null;
};

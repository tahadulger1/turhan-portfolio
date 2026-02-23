import { createClient } from '@supabase/supabase-js';

// Vercel ortamında env değişkeni eksikse (500 Invalid URL) hatası vermemesi için güvenlik önlemi
const supabaseUrl = (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined) || (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_URL : undefined) || 'https://eksik-env-degiskeni.supabase.co';
const supabaseKey = (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : undefined) || (typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.VITE_SUPABASE_ANON_KEY : undefined) || 'eksik-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

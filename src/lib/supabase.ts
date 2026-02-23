import { createClient } from '@supabase/supabase-js';

// Vercel ortamında env değişkeni eksikse (500 Invalid URL) hatası vermemesi için güvenlik önlemi
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://eksik-env-degiskeni.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eksik-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

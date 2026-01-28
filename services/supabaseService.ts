
import { createClient } from '@supabase/supabase-js';

// As chaves Supabase fornecidas pelo usuário
const supabaseUrl = 'https://smfflsfwtntqdifjivbh.supabase.co';
const supabaseAnonKey = 'sb_publishable_bYVzfNKLODSOOi8-yzBjHA_2Eg8b5g1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

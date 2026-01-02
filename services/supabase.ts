import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://byurfsmzxeemvmwbndif.supabase.co';
const supabaseAnonKey = 'sb_publishable_VQZ3Eh0NKggW0bqL8Qu1BA_6eX0BZ_P';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

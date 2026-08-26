import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://raufjvpmtdputixikcml.supabase.co';
const supabasePublishableKey = 'sb_publishable_kDB9iGLt-BU9zFRqIFDikA_k-umFmqO';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

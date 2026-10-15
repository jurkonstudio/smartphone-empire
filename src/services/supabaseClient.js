
import { createClient } from
  'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://xjhnngxcpnignjatmtpa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kBiGtSn3LBFVw0jCOFzg5w_h5gQ3orp';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { supabaseUrl,supabasePublishableKey } from './env';
/** Anonymous client for explicitly public views only, never a service key/session. */
export function publicClient(){return createClient<Database>(supabaseUrl,supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})}

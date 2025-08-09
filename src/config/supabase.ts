import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Database } from '../services/supabaseTypes';

const extra = Constants.expoConfig?.extra || Constants.manifest2?.extra || {};
const supabaseUrl = extra.SUPABASE_URL as string;
const supabaseAnonKey = extra.SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY in app config.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
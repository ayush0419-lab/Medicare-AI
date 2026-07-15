import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local');
}

// Custom sequential lock to prevent "lock stolen" errors when multiple hooks
// request the auth token at the same time (useNotifications, usePatients, etc.)
let _lockQueue = Promise.resolve();
const sequentialLock = (_name, _acquired, fn) => {
  const next = _lockQueue.then(() => fn());
  _lockQueue = next.catch(() => {});
  return next;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: sequentialLock,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

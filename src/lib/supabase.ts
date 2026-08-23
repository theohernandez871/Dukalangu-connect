import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loud in dev; avoids silent auth breakage.
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
} else if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co\/?$/.test(url.trim())) {
  // A malformed project URL is the usual cause of ERR_NAME_NOT_RESOLVED /
  // "Failed to fetch" at login. Supabase refs are 20 lowercase letters/digits.
  console.error(
    `VITE_SUPABASE_URL haionekani sahihi: "${url}". ` +
      'Inapaswa kuwa https://<project-ref>.supabase.co (herufi 20). ' +
      'Thibitisha kwenye Supabase -> Settings -> API -> Project URL, kisha sasisha env kwenye Vercel.',
  );
}

export const supabase = createClient((url ?? '').trim().replace(/\/+$/, ''), anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const functionUrl = import.meta.env.VITE_SUPABASE_FUNCTION_URL;

if (!supabaseUrl || !supabaseKey || !functionUrl) {
  throw new Error('ISOMO is missing its Supabase configuration. Please contact the administrator.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

async function request(method: 'GET' | 'POST', path: string, body?: unknown) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.access_token) throw new Error('Please sign in to continue.');

  const response = await fetch(functionUrl + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + session.access_token,
      apikey: supabaseKey,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return { data };
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: unknown) => request('POST', path, body),
};

export const auth = {
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    const u = data.user;
    return u ? {
      userId: u.id,
      email: u.email,
      name: u.user_metadata?.full_name || u.user_metadata?.name || u.email,
      picture: u.user_metadata?.avatar_url,
      scope: 'email profile',
    } : null;
  },
  async signInWithGoogle(requestedRole = 'student') {
    window.localStorage.setItem('isomo_requested_role', requestedRole);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, data: { requested_role: requestedRole }, queryParams: { access_type: 'offline', prompt: 'select_account' } },
    });
    if (error) throw error;
  },
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

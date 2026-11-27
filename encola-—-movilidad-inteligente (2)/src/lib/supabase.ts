import {createClient, type SupabaseClient} from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Initiates Google OAuth via Supabase when configured.
 * Returns false if running in local preview without Supabase env vars.
 */
export async function signInWithGoogleOAuth(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (!supabase) {
    return {
      ok: false,
      reason:
        'Supabase no está configurado en esta vista previa. Usa los accesos de Modo Demo debajo para probar todo el sistema al 100%.',
    };
  }

  const {error} = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    return {ok: false, reason: error.message};
  }
  return {ok: true};
}

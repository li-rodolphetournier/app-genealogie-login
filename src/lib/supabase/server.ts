/**
 * Client Supabase pour Server Components et Server Actions
 * Utilise les variables d'environnement pour la configuration
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Variables d\'environnement Supabase manquantes. Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies.'
    );
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // La gestion des cookies peut échouer dans certaines routes
            // (par exemple, dans les Server Actions)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // La gestion des cookies peut échouer dans certaines routes
          }
        },
      },
    }
  );
}

/**
 * Client Supabase avec service role key (pour les opérations administratives)
 * ⚠️ À utiliser uniquement dans les Server Actions ou API Routes sécurisées
 */
export async function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    // Pendant le build, les variables d'environnement peuvent ne pas être disponibles
    // On lance quand même une erreur mais elle sera catchée dans les pages avec try/catch
    const error = new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    );
    // Ajouter une propriété pour identifier les erreurs de build
    (error as any).isBuildError = true;
    throw error;
  }

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  
  return createSupabaseClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}


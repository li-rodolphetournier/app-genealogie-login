/**
 * API Route pour exécuter les tests de sécurité
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runSecurityTests } from '@/lib/security/tests/security-tests';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    // Vérifier l'authentification et les droits admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single();

    if (profile?.status !== 'administrateur') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer les résultats récents depuis la base de données
    const serviceSupabase = await createServiceRoleClient();
    const { data: recentResults } = await serviceSupabase
      .from('security_test_results')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    return NextResponse.json({ results: recentResults || [] });
  } catch (error) {
    console.error('[Security Tests API] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification et les droits admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single();

    if (profile?.status !== 'administrateur') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Exécuter les tests
    const results = await runSecurityTests();

    // Stocker les résultats dans Supabase
    const serviceSupabase = await createServiceRoleClient();
    await serviceSupabase.from('security_test_results').insert(
      results.map(r => ({
        ...r,
        id: r.id,
      }))
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[Security Tests API] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


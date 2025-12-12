/**
 * API Route pour exécuter les tests de sécurité
 * ⚠️ DÉSACTIVÉ EN PRODUCTION pour des raisons de sécurité
 */

import { NextResponse } from 'next/server';
import { runSecurityTests } from '@/lib/security/tests/security-tests';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/middleware';
import { isProduction } from '@/lib/utils/env';
import { logger } from '@/lib/utils/logger';

export async function GET(request: Request) {
  // Désactiver en production
  if (isProduction()) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    // Vérifier l'authentification et les droits admin (gère le mock)
    await requireAdmin();

    // Récupérer les résultats récents depuis la base de données
    const serviceSupabase = await createServiceRoleClient();
    const { data: recentResults } = await serviceSupabase
      .from('security_test_results')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    return NextResponse.json({ results: recentResults || [] });
  } catch (error) {
    logger.error('[Security Tests API] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Désactiver en production
  if (isProduction()) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    // Vérifier l'authentification et les droits admin (gère le mock)
    await requireAdmin();

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
    logger.error('[Security Tests API] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


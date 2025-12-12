/**
 * API Route pour les métriques de sécurité
 * ⚠️ DÉSACTIVÉ EN PRODUCTION pour des raisons de sécurité
 */

import { NextResponse } from 'next/server';
import { getSecurityMetrics } from '@/lib/monitoring/metrics';
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

    const metrics = await getSecurityMetrics();
    return NextResponse.json({ metrics });
  } catch (error) {
    logger.error('[Monitoring API] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


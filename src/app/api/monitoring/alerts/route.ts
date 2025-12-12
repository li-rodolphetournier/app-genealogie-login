/**
 * API Route pour les alertes de sécurité
 * ⚠️ DÉSACTIVÉ EN PRODUCTION pour des raisons de sécurité
 */

import { NextResponse } from 'next/server';
import { getSecurityAlerts, resolveSecurityAlert } from '@/lib/monitoring/alert-manager';
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

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const type = searchParams.get('type');
    const resolved = searchParams.get('resolved');
    const limit = searchParams.get('limit');

    const alerts = await getSecurityAlerts({
      level: level as any,
      type: type as any,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    logger.error('[Monitoring API] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  // Désactiver en production
  if (isProduction()) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    // Vérifier l'authentification et les droits admin (gère le mock)
    await requireAdmin();

    const { alertId } = await request.json();
    await resolveSecurityAlert(alertId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Monitoring API] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


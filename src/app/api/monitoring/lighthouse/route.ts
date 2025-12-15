/**
 * API Route pour lire le dernier rapport Lighthouse depuis Upstash Redis
 * ⚠️ DÉSACTIVÉ EN PRODUCTION pour des raisons de sécurité
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/middleware';
import { isProduction } from '@/lib/utils/env';
import { logger } from '@/lib/utils/logger';
import { getLatestLighthouseReport } from '@/lib/lighthouse/redis';

export async function GET() {
  // Désactiver en production
  if (isProduction()) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    // Vérifier l'authentification et les droits admin
    await requireAdmin();

    // Récupérer le rapport le plus récent depuis Redis
    const report = await getLatestLighthouseReport();

    if (!report) {
      return NextResponse.json({ report: null, error: 'Aucun rapport Lighthouse trouvé' });
    }

    // Retourner les données dans le format attendu par le frontend
    const result = {
      timestamp: report.timestamp,
      scores: report.scores,
      metrics: report.metrics,
    };

    return NextResponse.json({ report: result });
  } catch (error) {
    logger.error('[Lighthouse API] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' }, { status: 500 });
  }
}



/**
 * Utilitaires pour stocker et récupérer les rapports Lighthouse dans Upstash Redis
 */

import { Redis } from '@upstash/redis';

/**
 * Configuration Redis (Upstash)
 */
const isUpstashConfigured =
  typeof process.env.UPSTASH_REDIS_REST_URL !== 'undefined' &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN !== 'undefined';

let redis: Redis | null = null;

// Initialiser Redis si configuré
if (isUpstashConfigured) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation d\'Upstash Redis:', error);
    redis = null;
  }
}

/**
 * Clé pour stocker le rapport le plus récent
 */
const LATEST_REPORT_KEY = 'lighthouse:report:latest';

/**
 * Préfixe pour les rapports individuels
 */
const REPORT_KEY_PREFIX = 'lighthouse:report:';

/**
 * Clé pour la liste des timestamps des rapports
 */
const REPORTS_LIST_KEY = 'lighthouse:reports:list';

/**
 * Type pour les métadonnées du rapport
 * Optimisé : on stocke seulement les métadonnées essentielles (pas le JSON/HTML complet)
 * pour réduire la taille et améliorer les performances
 */
export type LighthouseReportMetadata = {
  timestamp: string;
  url: string;
  scores: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  metrics: {
    fcp: { value: number; displayValue: string; score: number | null } | null;
    lcp: { value: number; displayValue: string; score: number | null } | null;
    tbt: { value: number; displayValue: string; score: number | null } | null;
    speedIndex: { value: number; displayValue: string; score: number | null } | null;
    cls: { value: number; displayValue: string; score: number | null } | null;
  };
  // Optionnel : si vous avez vraiment besoin du JSON/HTML complet, décommentez :
  // jsonData?: string; // JSON stringifié du rapport complet (volumineux)
  // htmlData?: string; // HTML stringifié (volumineux)
};

/**
 * Sauvegarder un rapport Lighthouse dans Redis
 */
export async function saveLighthouseReport(metadata: LighthouseReportMetadata): Promise<boolean> {
  if (!redis) {
    console.warn('⚠️ Redis non configuré. Rapport non sauvegardé.');
    return false;
  }

  try {
    const reportKey = `${REPORT_KEY_PREFIX}${metadata.timestamp}`;

    // Sauvegarder le rapport complet
    await redis.set(reportKey, metadata, { ex: 30 * 24 * 60 * 60 }); // Expire après 30 jours

    // Marquer comme le plus récent
    await redis.set(LATEST_REPORT_KEY, metadata.timestamp, { ex: 30 * 24 * 60 * 60 });

    // Ajouter à la liste des rapports (garder seulement les 50 derniers)
    await redis.lpush(REPORTS_LIST_KEY, metadata.timestamp);
    await redis.ltrim(REPORTS_LIST_KEY, 0, 49); // Garder seulement les 50 premiers

    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du rapport Lighthouse:', error);
    return false;
  }
}

/**
 * Récupérer le rapport Lighthouse le plus récent
 */
export async function getLatestLighthouseReport(): Promise<LighthouseReportMetadata | null> {
  if (!redis) {
    return null;
  }

  try {
    // Récupérer le timestamp du rapport le plus récent
    const latestTimestamp = await redis.get<string>(LATEST_REPORT_KEY);
    
    if (!latestTimestamp) {
      return null;
    }

    // Récupérer le rapport
    const reportKey = `${REPORT_KEY_PREFIX}${latestTimestamp}`;
    const report = await redis.get<LighthouseReportMetadata>(reportKey);

    return report || null;
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport Lighthouse:', error);
    return null;
  }
}

/**
 * Récupérer un rapport par timestamp
 */
export async function getLighthouseReportByTimestamp(timestamp: string): Promise<LighthouseReportMetadata | null> {
  if (!redis) {
    return null;
  }

  try {
    const reportKey = `${REPORT_KEY_PREFIX}${timestamp}`;
    const report = await redis.get<LighthouseReportMetadata>(reportKey);
    return report || null;
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport Lighthouse:', error);
    return null;
  }
}

/**
 * Récupérer la liste des timestamps des rapports disponibles
 */
export async function getLighthouseReportsList(limit = 50): Promise<string[]> {
  if (!redis) {
    return [];
  }

  try {
    const timestamps = await redis.lrange(REPORTS_LIST_KEY, 0, limit - 1);
    // lrange retourne un tableau de strings
    return (Array.isArray(timestamps) ? timestamps : []) as string[];
  } catch (error) {
    console.error('Erreur lors de la récupération de la liste des rapports:', error);
    return [];
  }
}


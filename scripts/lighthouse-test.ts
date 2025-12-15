#!/usr/bin/env tsx

/**
 * Script pour lancer des tests Lighthouse sur l'application
 * Usage: tsx scripts/lighthouse-test.ts [url]
 * Exemple: tsx scripts/lighthouse-test.ts http://localhost:3000
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { Redis } from '@upstash/redis';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEFAULT_URL = 'http://localhost:3000';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Créer le client Redis (Upstash)
function getRedisClient(): Redis | null {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn('⚠️ Variables Upstash Redis non définies. Les rapports seront sauvegardés localement uniquement.');
    return null;
  }

  try {
    return new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } catch (error) {
    console.warn('⚠️ Erreur lors de l\'initialisation d\'Upstash Redis:', error);
    return null;
  }
}

/**
 * Sauvegarder un rapport dans Redis
 */
async function saveToRedis(redis: Redis, url: string, lhr: any, htmlReport: string | null) {
  try {
    const categories = lhr.categories || {};
    const audits = lhr.audits || {};

    // Optimisé : on stocke seulement les métadonnées essentielles (pas le JSON/HTML complet)
    // pour réduire la taille et améliorer les performances Redis
    const metadata = {
      timestamp: TIMESTAMP,
      url,
      // jsonData et htmlData non inclus pour réduire la taille (3-5MB → ~5KB)
      scores: {
        performance: categories.performance?.score !== null ? Math.round((categories.performance?.score || 0) * 100) : null,
        accessibility: categories.accessibility?.score !== null ? Math.round((categories.accessibility?.score || 0) * 100) : null,
        bestPractices: categories['best-practices']?.score !== null ? Math.round((categories['best-practices']?.score || 0) * 100) : null,
        seo: categories.seo?.score !== null ? Math.round((categories.seo?.score || 0) * 100) : null,
      },
      metrics: {
        fcp: audits['first-contentful-paint']
          ? {
              value: audits['first-contentful-paint'].numericValue,
              displayValue: audits['first-contentful-paint'].displayValue,
              score: audits['first-contentful-paint'].score !== null ? Math.round((audits['first-contentful-paint'].score || 0) * 100) : null,
            }
          : null,
        lcp: audits['largest-contentful-paint']
          ? {
              value: audits['largest-contentful-paint'].numericValue,
              displayValue: audits['largest-contentful-paint'].displayValue,
              score: audits['largest-contentful-paint'].score !== null ? Math.round((audits['largest-contentful-paint'].score || 0) * 100) : null,
            }
          : null,
        tbt: audits['total-blocking-time']
          ? {
              value: audits['total-blocking-time'].numericValue,
              displayValue: audits['total-blocking-time'].displayValue,
              score: audits['total-blocking-time'].score !== null ? Math.round((audits['total-blocking-time'].score || 0) * 100) : null,
            }
          : null,
        speedIndex: audits['speed-index']
          ? {
              value: audits['speed-index'].numericValue,
              displayValue: audits['speed-index'].displayValue,
              score: audits['speed-index'].score !== null ? Math.round((audits['speed-index'].score || 0) * 100) : null,
            }
          : null,
        cls: audits['cumulative-layout-shift']
          ? {
              value: audits['cumulative-layout-shift'].numericValue,
              displayValue: audits['cumulative-layout-shift'].displayValue,
              score: audits['cumulative-layout-shift'].score !== null ? Math.round((audits['cumulative-layout-shift'].score || 0) * 100) : null,
            }
          : null,
      },
    };

    // Clés Redis
    const LATEST_REPORT_KEY = 'lighthouse:report:latest';
    const REPORT_KEY = `lighthouse:report:${TIMESTAMP}`;
    const REPORTS_LIST_KEY = 'lighthouse:reports:list';

    // Sauvegarder le rapport
    await redis.set(REPORT_KEY, metadata, { ex: 30 * 24 * 60 * 60 }); // Expire après 30 jours

    // Marquer comme le plus récent
    await redis.set(LATEST_REPORT_KEY, TIMESTAMP, { ex: 30 * 24 * 60 * 60 });

    // Ajouter à la liste des rapports (garder seulement les 50 derniers)
    await redis.lpush(REPORTS_LIST_KEY, TIMESTAMP);
    await redis.ltrim(REPORTS_LIST_KEY, 0, 49); // Garder seulement les 50 premiers

    console.log('✅ Rapport sauvegardé dans Upstash Redis');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde dans Redis:', error);
    return false;
  }
}

/**
 * Attendre que le serveur soit disponible
 */
async function waitForServer(url: string, maxAttempts = 30, delay = 1000) {
  console.log(`⏳ Vérification de la disponibilité du serveur ${url}...\n`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(2000)
      } as RequestInit);
      
      if (response.ok) {
        console.log('✅ Serveur disponible!\n');
        return true;
      }
    } catch (error) {
      // Serveur pas encore disponible
      if (i < maxAttempts - 1) {
        process.stdout.write(`\r⏳ Tentative ${i + 1}/${maxAttempts}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.log('\n❌ Le serveur n\'est pas disponible après plusieurs tentatives.');
  console.log('💡 Assurez-vous que le serveur est démarré avec: npm run dev\n');
  return false;
}

async function runLighthouse(url: string = DEFAULT_URL) {
  // Attendre que le serveur soit disponible
  const serverAvailable = await waitForServer(url);
  if (!serverAvailable) {
    process.exit(1);
  }

  console.log(`🚀 Lancement de Lighthouse sur ${url}...\n`);
  
  // Initialiser Redis
  const redis = getRedisClient();

  // Import dynamique de lighthouse uniquement dans ce script (pas dans l'app Next)
  const lighthouseModule = await import('lighthouse');
  const lighthouse = lighthouseModule.default || lighthouseModule;

  const chromeLauncher = await import('chrome-launcher');
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  try {
    const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] as string[],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);
    if (!runnerResult) {
      throw new Error('Lighthouse a retourné un résultat vide');
    }

    const report = runnerResult.report;
    const lhr = JSON.parse(report as string);

    // Afficher les scores
    console.log('📊 Résultats Lighthouse (catégories):\n');
    console.log('═══════════════════════════════════════');
    
    const categories = lhr.categories || {};
    for (const [key, category] of Object.entries(categories)) {
      const cat = category as { title: string; score: number | null };
      if (cat.score !== null) {
        const score = Math.round((cat.score as number) * 100);
        const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
        console.log(`${emoji} ${cat.title.padEnd(20)}: ${score}/100`);
      }
    }

    console.log('\n═══════════════════════════════════════\n');

    // Afficher les métriques principales
    const audits = lhr.audits || {};
    const metrics = {
      'First Contentful Paint': audits['first-contentful-paint'],
      'Largest Contentful Paint': audits['largest-contentful-paint'],
      'Total Blocking Time': audits['total-blocking-time'],
      'Speed Index': audits['speed-index'],
      'Cumulative Layout Shift': audits['cumulative-layout-shift'],
    };

    console.log('📈 Métriques de Performance:\n');
    for (const [name, audit] of Object.entries(metrics)) {
      if (audit && audit.numericValue !== undefined) {
        const value = audit.numericValue;
        const unit = audit.numericUnit || '';
        const displayValue = audit.displayValue || `${value} ${unit}`;
        const score = audit.score !== null ? Math.round(audit.score * 100) : null;
        const emoji = score !== null ? (score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴') : '⚪';
        
        console.log(`${emoji} ${name.padEnd(30)}: ${displayValue}${score !== null ? ` (score: ${score})` : ''}`);
      }
    }

    // Générer le rapport HTML
    console.log('\n📄 Génération du rapport HTML...\n');
    const htmlReportResult = await lighthouse(url, { ...options, output: 'html' });
    const htmlReport = htmlReportResult?.report as string | null;

    // Sauvegarder dans Redis si disponible
    if (redis) {
      await saveToRedis(redis, url, lhr, htmlReport || null);
    } else {
      // Fallback: sauvegarder localement
      console.log('\n💾 Sauvegarde locale (Redis non configuré)...\n');
      const fs = await import('fs');
      const OUTPUT_DIR = '.cursor';
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }

      const jsonFilename = `lighthouse-test-${TIMESTAMP}.json`;
      const jsonFilepath = path.join(OUTPUT_DIR, jsonFilename);
      fs.writeFileSync(jsonFilepath, report as string);
      console.log(`💾 Rapport JSON sauvegardé localement: ${jsonFilepath}`);

      if (htmlReport) {
        const htmlFilename = `lighthouse-test-${TIMESTAMP}.html`;
        const htmlFilepath = path.join(OUTPUT_DIR, htmlFilename);
        fs.writeFileSync(htmlFilepath, htmlReport);
        console.log(`📄 Rapport HTML sauvegardé localement: ${htmlFilepath}`);
      }
    }

    console.log('\n✅ Rapport Lighthouse généré avec succès!\n');

    return lhr;
  } finally {
    await chrome.kill();
  }
}

// Main
const url = process.argv[2] || DEFAULT_URL;

runLighthouse(url).catch((error) => {
  console.error('❌ Erreur lors de l\'exécution de Lighthouse:', error);
  process.exit(1);
});

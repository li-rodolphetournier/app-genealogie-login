#!/usr/bin/env tsx

/**
 * Script pour lancer des tests Lighthouse sur l'application
 * Usage: tsx scripts/lighthouse-test.ts [url]
 * Exemple: tsx scripts/lighthouse-test.ts http://localhost:3000
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_URL = 'http://localhost:3000';
const OUTPUT_DIR = '.cursor';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

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

    // Sauvegarder le rapport complet
    const filename = `lighthouse-test-${TIMESTAMP}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(filepath, report as string);
    console.log(`\n💾 Rapport complet sauvegardé: ${filepath}\n`);

    // Sauvegarder aussi un rapport HTML
    const htmlFilename = `lighthouse-test-${TIMESTAMP}.html`;
    const htmlFilepath = path.join(OUTPUT_DIR, htmlFilename);
    
    // Générer le rapport HTML
    const htmlReport = await lighthouse(url, { ...options, output: 'html' });
    if (htmlReport?.report) {
      fs.writeFileSync(htmlFilepath, htmlReport.report as string);
      console.log(`📄 Rapport HTML sauvegardé: ${htmlFilepath}\n`);
    }

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

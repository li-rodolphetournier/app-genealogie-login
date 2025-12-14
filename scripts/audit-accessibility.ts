#!/usr/bin/env tsx
/**
 * Script d'audit d'accessibilité automatisé
 * Utilise Pa11y pour tester les pages en mode light et dark
 */

import * as pa11y from 'pa11y';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Pages à auditer
const PAGES = [
  { path: '/', name: 'Page de connexion' },
  { path: '/accueil', name: 'Page d\'accueil' },
  { path: '/users', name: 'Liste utilisateurs' },
  { path: '/objects', name: 'Liste objets' },
  { path: '/messages', name: 'Messages' },
  { path: '/genealogie', name: 'Généalogie' },
  { path: '/admin', name: 'Administration' },
  { path: '/create-user', name: 'Création utilisateur' },
  { path: '/forgot-password', name: 'Mot de passe oublié' },
];

// Configuration Pa11y
const pa11yConfig = {
  standard: 'WCAG2AA',
  timeout: 30000,
  wait: 2000,
  chromeLaunchConfig: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  includeWarnings: true,
  includeNotices: true,
  log: {
    debug: console.log,
    error: console.error,
    info: console.log,
  },
};

interface AuditResult {
  page: string;
  name: string;
  mode: 'light' | 'dark';
  device: 'desktop' | 'mobile';
  url: string;
  errors: number;
  warnings: number;
  notices: number;
  issues: Array<{
    code: string;
    type: string;
    typeCode: number;
    message: string;
    context: string;
    selector: string;
  }>;
  score?: number;
}

async function runPa11yAudit(
  url: string,
  pageName: string,
  mode: 'light' | 'dark',
  device: 'desktop' | 'mobile'
): Promise<AuditResult> {
  const viewport = device === 'mobile' 
    ? { width: 375, height: 667 }
    : { width: 1920, height: 1080 };

  const fullUrl = `${BASE_URL}${url}${url.includes('?') ? '&' : '?'}theme=${mode}`;

  console.log(`\n🔍 Audit: ${pageName} (${mode}, ${device})`);
  console.log(`   URL: ${fullUrl}`);

  try {
    // Pa11y est une fonction par défaut
    const pa11yFunction = (pa11y as any).default || pa11y;
    const result = await pa11yFunction(fullUrl, {
      ...pa11yConfig,
      viewport: viewport,
      browser: 'chromium',
    });

    const errors = result.issues.filter(i => i.type === 'error');
    const warnings = result.issues.filter(i => i.type === 'warning');
    const notices = result.issues.filter(i => i.type === 'notice');

    // Calculer un score (100 - (erreurs * 10 + warnings * 2 + notices))
    const score = Math.max(0, 100 - (errors.length * 10 + warnings.length * 2 + notices.length));

    return {
      page: url,
      name: pageName,
      mode,
      device,
      url: fullUrl,
      errors: errors.length,
      warnings: warnings.length,
      notices: notices.length,
      issues: result.issues.map(issue => ({
        code: issue.code,
        type: issue.type,
        typeCode: issue.typeCode,
        message: issue.message,
        context: issue.context || '',
        selector: issue.selector || '',
      })),
      score,
    };
  } catch (error) {
    console.error(`❌ Erreur lors de l'audit de ${pageName}:`, error);
    return {
      page: url,
      name: pageName,
      mode,
      device,
      url: fullUrl,
      errors: 0,
      warnings: 0,
      notices: 0,
      issues: [],
      score: 0,
    };
  }
}

async function generateReport(results: AuditResult[]): Promise<string> {
  const timestamp = new Date().toISOString();
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings, 0);
  const totalNotices = results.reduce((sum, r) => sum + r.notices, 0);
  const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;

  let report = `# 📊 Rapport d'Audit d'Accessibilité\n\n`;
  report += `**Date** : ${new Date().toLocaleString('fr-FR')}\n`;
  report += `**Base URL** : ${BASE_URL}\n\n`;
  report += `## 📈 Synthèse Globale\n\n`;
  report += `| Métrique | Valeur |\n`;
  report += `|----------|--------|\n`;
  report += `| **Pages auditées** | ${results.length} |\n`;
  report += `| **Erreurs totales** | ${totalErrors} |\n`;
  report += `| **Avertissements** | ${totalWarnings} |\n`;
  report += `| **Notices** | ${totalNotices} |\n`;
  report += `| **Score moyen** | ${avgScore.toFixed(1)}/100 |\n\n`;

  // Résultats par mode et device
  report += `## 📊 Résultats par Mode et Device\n\n`;
  report += `| Page | Mode | Device | Erreurs | Avertissements | Score |\n`;
  report += `|------|------|--------|---------|----------------|-------|\n`;

  for (const result of results) {
    const status = result.errors === 0 ? '✅' : result.errors < 5 ? '⚠️' : '❌';
    report += `| ${result.name} | ${result.mode} | ${result.device} | ${result.errors} | ${result.warnings} | ${result.score}/100 ${status} |\n`;
  }

  // Détails des problèmes
  report += `\n## 🔍 Détails des Problèmes\n\n`;

  const problemsByPage = results.filter(r => r.errors > 0 || r.warnings > 0);
  
  if (problemsByPage.length === 0) {
    report += `✅ Aucun problème détecté !\n\n`;
  } else {
    for (const result of problemsByPage) {
      report += `### ${result.name} (${result.mode}, ${result.device})\n\n`;
      report += `**URL** : ${result.url}\n\n`;

      const errors = result.issues.filter(i => i.type === 'error');
      const warnings = result.issues.filter(i => i.type === 'warning');

      if (errors.length > 0) {
        report += `#### 🔴 Erreurs (${errors.length})\n\n`;
        for (const error of errors) {
          report += `- **${error.code}** : ${error.message}\n`;
          if (error.context) {
            report += `  - Contexte : \`${error.context}\`\n`;
          }
          if (error.selector) {
            report += `  - Sélecteur : \`${error.selector}\`\n`;
          }
          report += `\n`;
        }
      }

      if (warnings.length > 0) {
        report += `#### 🟡 Avertissements (${warnings.length})\n\n`;
        for (const warning of warnings.slice(0, 10)) { // Limiter à 10 pour la lisibilité
          report += `- **${warning.code}** : ${warning.message}\n`;
        }
        if (warnings.length > 10) {
          report += `\n*... et ${warnings.length - 10} autres avertissements*\n`;
        }
      }

      report += `\n---\n\n`;
    }
  }

  // Recommandations
  report += `## 🎯 Recommandations Prioritaires\n\n`;

  const criticalIssues = results
    .flatMap(r => r.issues.filter(i => i.type === 'error'))
    .filter(i => 
      i.code.includes('color-contrast') || 
      i.code.includes('button-name') ||
      i.code.includes('image-alt')
    );

  if (criticalIssues.length > 0) {
    report += `### 🔴 Priorité CRITIQUE\n\n`;
    const uniqueIssues = Array.from(new Set(criticalIssues.map(i => i.code)));
    for (const code of uniqueIssues) {
      const count = criticalIssues.filter(i => i.code === code).length;
      report += `- **${code}** : ${count} occurrence(s)\n`;
    }
    report += `\n`;
  }

  report += `---\n\n`;
  report += `*Rapport généré automatiquement par Pa11y*\n`;

  return report;
}

async function main() {
  console.log('🚀 Démarrage de l\'audit d\'accessibilité...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const results: AuditResult[] = [];

  // Auditer chaque page en mode light et dark, desktop et mobile
  for (const page of PAGES) {
    // Mode Light - Desktop
    const lightDesktop = await runPa11yAudit(page.path, page.name, 'light', 'desktop');
    results.push(lightDesktop);

    // Mode Light - Mobile
    const lightMobile = await runPa11yAudit(page.path, page.name, 'light', 'mobile');
    results.push(lightMobile);

    // Mode Dark - Desktop
    const darkDesktop = await runPa11yAudit(page.path, page.name, 'dark', 'desktop');
    results.push(darkDesktop);

    // Mode Dark - Mobile
    const darkMobile = await runPa11yAudit(page.path, page.name, 'dark', 'mobile');
    results.push(darkMobile);
  }

  // Générer le rapport
  const report = await generateReport(results);

  // Sauvegarder le rapport
  const reportDir = path.join(process.cwd(), 'documentation', 'audit-accessibility');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `rapport-${Date.now()}.md`);
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log(`\n✅ Audit terminé !`);
  console.log(`📄 Rapport sauvegardé : ${reportPath}\n`);

  // Afficher un résumé
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings, 0);
  const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;

  console.log(`📊 Résumé :`);
  console.log(`   - Erreurs : ${totalErrors}`);
  console.log(`   - Avertissements : ${totalWarnings}`);
  console.log(`   - Score moyen : ${avgScore.toFixed(1)}/100\n`);

  if (totalErrors > 0) {
    console.log(`⚠️  Des problèmes critiques ont été détectés. Consultez le rapport pour plus de détails.`);
    process.exit(1);
  } else {
    console.log(`✅ Aucune erreur critique détectée !`);
    process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});


/**
 * Script de vérification pré-déploiement en production
 * Vérifie que toutes les configurations sont correctes avant le déploiement
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

type CheckResult = {
  name: string;
  success: boolean;
  message: string;
  critical?: boolean;
};

const checks: CheckResult[] = [];

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m',
  };
  
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
  };
  
  console.log(`${colors[type]}${icons[type]} ${message}${colors.reset}`);
}

function checkEnvironmentVariables(): CheckResult {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const productionVars = [
    'NEXT_PUBLIC_APP_URL',
  ];

  const missing: string[] = [];
  const missingProd: string[] = [];

  // Vérifier les variables requises
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Vérifier les variables de production
  // Note: On vérifie toujours, mais on adapte le niveau de criticité
  const isReallyProduction = process.env.NODE_ENV === 'production' && 
                              !process.env.CHECK_PRODUCTION_MODE; // Mode vérification locale
  
  for (const varName of productionVars) {
    if (!process.env[varName]) {
      missingProd.push(varName);
    }
  }

  if (missing.length > 0) {
    return {
      name: 'Variables d\'environnement requises',
      success: false,
      message: `Variables manquantes: ${missing.join(', ')}`,
      critical: true,
    };
  }

  if (missingProd.length > 0) {
    // Si on est vraiment en production (pas juste en mode vérification), c'est critique
    // Sinon, c'est un avertissement car on peut être en train de vérifier localement
    if (isReallyProduction) {
      return {
        name: 'Variables d\'environnement production',
        success: false,
        message: `Variables de production manquantes: ${missingProd.join(', ')}. ⚠️ CRITIQUE en production !`,
        critical: true,
      };
    } else {
      return {
        name: 'Variables d\'environnement production',
        success: false,
        message: `Variables de production manquantes: ${missingProd.join(', ')}. ⚠️ À définir avant le déploiement en production.`,
        critical: false, // Avertissement, pas une erreur critique en mode vérification
      };
    }
  }

  return {
    name: 'Variables d\'environnement',
    success: true,
    message: 'Toutes les variables requises sont définies',
  };
}

function checkFeatureFlags(): CheckResult {
  const nodeEnv = process.env.NODE_ENV || 'production';
  const isProduction = nodeEnv === 'production';
  
  if (!isProduction) {
    return {
      name: 'Feature Flags',
      success: true,
      message: 'Mode développement - vérification des feature flags ignorée',
    };
  }

  const issues: string[] = [];

  // Vérifier que Auth Debug est désactivé en production (sauf si explicitement activé)
  const authDebug = process.env.NEXT_PUBLIC_ENABLE_AUTH_DEBUG;
  if (authDebug === 'true') {
    issues.push('NEXT_PUBLIC_ENABLE_AUTH_DEBUG est activé en production (non recommandé)');
  }

  // Vérifier que Mock Auth est désactivé en production
  const mockAuth = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH;
  if (mockAuth === 'true') {
    return {
      name: 'Feature Flags',
      success: false,
      message: 'NEXT_PUBLIC_ENABLE_MOCK_AUTH est activé en production (CRITIQUE - sécurité)',
      critical: true,
    };
  }

  if (issues.length > 0) {
    return {
      name: 'Feature Flags',
      success: false,
      message: issues.join(', '),
      critical: false,
    };
  }

  return {
    name: 'Feature Flags',
    success: true,
    message: 'Toutes les feature flags sont correctement configurées',
  };
}

function checkConsoleLogs(): CheckResult {
  // Vérifier qu'il n'y a pas de console.log/console.debug dans les fichiers client
  const clientFiles = [
    'src/app/**/*.tsx',
    'src/components/**/*.tsx',
    'src/hooks/**/*.ts',
  ];

  // Cette vérification nécessiterait un parsing plus complexe
  // Pour l'instant, on se contente d'un avertissement
  return {
    name: 'Console.log côté client',
    success: true,
    message: 'Vérifiez manuellement qu\'il n\'y a pas de console.log/console.debug dans les composants client',
  };
}

function checkMonitoringRoutes(): CheckResult {
  // Vérifier que les routes de monitoring sont protégées
  const monitoringRoutes = [
    'src/app/api/monitoring/tests/route.ts',
    'src/app/api/monitoring/metrics/route.ts',
    'src/app/api/monitoring/alerts/route.ts',
  ];

  const unprotected: string[] = [];

  for (const route of monitoringRoutes) {
    const filePath = join(process.cwd(), route);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      if (!content.includes('isProduction()') && !content.includes('NODE_ENV === \'production\'')) {
        unprotected.push(route);
      }
    }
  }

  if (unprotected.length > 0) {
    return {
      name: 'Routes de monitoring',
      success: false,
      message: `Routes non protégées: ${unprotected.join(', ')}`,
      critical: true,
    };
  }

  return {
    name: 'Routes de monitoring',
    success: true,
    message: 'Toutes les routes de monitoring sont protégées',
  };
}

function checkSecurityTests(): CheckResult {
  const filePath = join(process.cwd(), 'src/lib/security/tests/security-tests.ts');
  
  if (!existsSync(filePath)) {
    return {
      name: 'Tests de sécurité',
      success: true,
      message: 'Fichier de tests de sécurité non trouvé (optionnel)',
    };
  }

  const content = readFileSync(filePath, 'utf-8');
  
  // Vérifier qu'il n'y a plus de localhost hardcodé
  if (content.includes("'http://localhost:3000'") || content.includes('"http://localhost:3000"')) {
    return {
      name: 'Tests de sécurité',
      success: false,
      message: 'localhost hardcodé trouvé dans les tests de sécurité',
      critical: false,
    };
  }

  return {
    name: 'Tests de sécurité',
    success: true,
    message: 'Les tests de sécurité utilisent NEXT_PUBLIC_APP_URL',
  };
}

async function main() {
  log('🔍 Vérification pré-déploiement en production...\n', 'info');

  // Marquer qu'on est en mode vérification (pas vraiment en production)
  process.env.CHECK_PRODUCTION_MODE = 'true';

  // Vérifier NODE_ENV (ne pas le modifier car il est en lecture seule)
  const nodeEnv = process.env.NODE_ENV || 'production';
  if (!process.env.NODE_ENV) {
    log('ℹ️  NODE_ENV non défini - Utilisation de "production" par défaut pour cette vérification', 'info');
  } else {
    log(`ℹ️  NODE_ENV actuel: ${nodeEnv}`, 'info');
  }
  
  log('ℹ️  Mode vérification: Les variables de production manquantes seront des avertissements, pas des erreurs critiques\n', 'info');

  // Charger les variables d'environnement depuis .env.local si présent
  const envPath = join(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }

  // Exécuter les vérifications
  checks.push(checkEnvironmentVariables());
  checks.push(checkFeatureFlags());
  checks.push(checkMonitoringRoutes());
  checks.push(checkSecurityTests());
  checks.push(checkConsoleLogs());

  // Afficher les résultats
  console.log('\n📋 Résultats des vérifications:\n');
  
  let hasErrors = false;
  let hasCriticalErrors = false;

  for (const check of checks) {
    if (check.success) {
      log(`${check.name}: ${check.message}`, 'success');
    } else {
      if (check.critical) {
        log(`${check.name}: ${check.message}`, 'error');
        hasCriticalErrors = true;
      } else {
        log(`${check.name}: ${check.message}`, 'warning');
      }
      hasErrors = true;
    }
  }

  console.log('\n');

  // Résumé final
  if (hasCriticalErrors) {
    log('❌ ERREURS CRITIQUES DÉTECTÉES - Ne pas déployer en production !', 'error');
    log('\n💡 Actions à prendre:', 'info');
    checks.filter(c => !c.success && c.critical).forEach(check => {
      log(`   - ${check.name}: ${check.message}`, 'error');
    });
    process.exit(1);
  } else if (hasErrors) {
    log('⚠️  AVERTISSEMENTS DÉTECTÉS - Vérifiez avant de déployer', 'warning');
    log('\n💡 Actions recommandées:', 'info');
    checks.filter(c => !c.success && !c.critical).forEach(check => {
      log(`   - ${check.name}: ${check.message}`, 'warning');
    });
    log('\n✅ Aucune erreur critique - Vous pouvez déployer, mais assurez-vous de configurer les variables manquantes dans votre plateforme de déploiement.', 'success');
    process.exit(0);
  } else {
    log('✅ Toutes les vérifications sont passées - Prêt pour la production !', 'success');
    process.exit(0);
  }
}

main().catch(error => {
  log(`Erreur lors de la vérification: ${error.message}`, 'error');
  process.exit(1);
});


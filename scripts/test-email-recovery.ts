/**
 * Script de test pour l'envoi d'email de récupération de mot de passe
 * 
 * Usage: npm run test:email-recovery
 * 
 * Ce script teste l'envoi d'email de récupération avec vérifications détaillées
 */

import { createServiceRoleClient } from '../src/lib/supabase/server';
import { getPasswordResetLogs } from '../src/lib/audit/password-reset-logger';
import * as readline from 'readline';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Créer readline seulement si stdin est disponible
let rl: readline.Interface | null = null;
if (process.stdin.isTTY) {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!rl) {
      // Mode non-interactif, retourner une chaîne vide
      resolve('');
      return;
    }
    try {
      rl.question(query, resolve);
    } catch (error) {
      reject(error);
    }
  });
}

function closeReadline() {
  if (rl) {
    try {
      rl.close();
    } catch (error) {
      // Ignorer les erreurs si l'interface est déjà fermée
    }
  }
}

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
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

async function checkEnvironmentVariables() {
  log('\n📋 Vérification des variables d\'environnement', 'info');
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const optional = [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_APP_URL',
  ];
  
  let allOk = true;
  
  for (const key of required) {
    const value = process.env[key];
    if (value) {
      log(`${key}: Configuré (${value.substring(0, 20)}...)`, 'success');
    } else {
      log(`${key}: MANQUANT`, 'error');
      allOk = false;
    }
  }
  
  for (const key of optional) {
    const value = process.env[key];
    if (value) {
      log(`${key}: ${value}`, 'success');
    } else {
      log(`${key}: Non configuré (utilisera le fallback)`, 'warning');
    }
  }
  
  // Afficher l'URL de redirection qui sera utilisée
  const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://genealogie-famille.vercel.app'}/reset-password`;
  log(`\nURL de redirection qui sera utilisée: ${redirectUrl}`, 'info');
  
  return allOk;
}

async function checkSupabaseConnection() {
  log('\n🔌 Test de connexion Supabase', 'info');
  
  try {
    const supabase = await createServiceRoleClient();
    
    // Test simple de connexion
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      log(`Erreur de connexion: ${error.message}`, 'error');
      return false;
    }
    
    log('Connexion Supabase OK', 'success');
    return true;
  } catch (error) {
    log(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
    return false;
  }
}

async function checkUserExists(emailOrLogin: string) {
  log(`\n👤 Vérification de l'utilisateur: ${emailOrLogin}`, 'info');
  
  try {
    const supabase = await createServiceRoleClient();
    const isEmail = emailOrLogin.includes('@');
    
    // Vérifier dans public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('id, email, login, status')
      .eq(isEmail ? 'email' : 'login', emailOrLogin)
      .single();
    
    if (publicError || !publicUser) {
      log(`Utilisateur non trouvé dans public.users`, 'error');
      return null;
    }
    
    log(`Utilisateur trouvé dans public.users:`, 'success');
    log(`  - ID: ${publicUser.id}`, 'info');
    log(`  - Email: ${publicUser.email}`, 'info');
    log(`  - Login: ${publicUser.login}`, 'info');
    log(`  - Status: ${publicUser.status}`, 'info');
    
    // Vérifier dans auth.users
    const { data: authUsersData } = await supabase.auth.admin.listUsers();
    const authUser = authUsersData?.users?.find(u => u.email === publicUser.email);
    
    if (authUser) {
      log(`Utilisateur trouvé dans auth.users:`, 'success');
      log(`  - ID: ${authUser.id}`, 'info');
      log(`  - Email confirmé: ${authUser.email_confirmed_at ? 'Oui' : 'Non'}`, 'info');
    } else {
      log(`Utilisateur NON trouvé dans auth.users (sera créé automatiquement)`, 'warning');
    }
    
    return { publicUser, authUser };
  } catch (error) {
    log(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
    return null;
  }
}

async function testEmailSending(emailOrLogin: string, baseUrl: string = 'http://localhost:3000') {
  log(`\n📧 Test d'envoi d'email de récupération`, 'info');
  log(`URL de base: ${baseUrl}`, 'info');
  
  try {
    const isEmail = emailOrLogin.includes('@');
    const body = isEmail 
      ? { email: emailOrLogin }
      : { login: emailOrLogin };
    
    // Utiliser la route Supabase
    log(`Envoi de la requête POST à ${baseUrl}/api/auth/forgot-password...`, 'info');
    
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const duration = Date.now() - startTime;
    
    const data = await response.json();
    
    log(`Réponse reçue en ${duration}ms`, 'info');
    log(`Status: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error');
    
    if (response.ok) {
      log(`Message: ${data.message}`, 'success');
      
      // Attendre un peu pour que le log soit créé
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Vérifier les logs
      const email = isEmail ? emailOrLogin : (await checkUserExists(emailOrLogin))?.publicUser?.email;
      if (email) {
        await checkPasswordResetLogs(email);
      }
      
      return true;
    } else {
      log(`Erreur: ${data.error || 'Erreur inconnue'}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
    return false;
  }
}

async function checkPasswordResetLogs(userEmail: string) {
  log(`\n📝 Vérification des logs de réinitialisation pour: ${userEmail}`, 'info');
  
  try {
    const logs = await getPasswordResetLogs(undefined, userEmail, 5);
    
    if (logs.length === 0) {
      log('Aucun log trouvé (peut être normal si la table n\'existe pas encore)', 'warning');
      return;
    }
    
    log(`Derniers ${logs.length} log(s) trouvé(s):`, 'success');
    
    for (const logEntry of logs) {
      const status = logEntry.success ? '✅' : '❌';
      
      console.log(`\n${status} ${logEntry.actionType}`);
      console.log(`   Email: ${logEntry.userEmail}`);
      if (logEntry.errorMessage) {
        console.log(`   ⚠️  Erreur: ${logEntry.errorMessage}`);
      }
      if (logEntry.ipAddress) {
        console.log(`   IP: ${logEntry.ipAddress}`);
      }
    }
  } catch (error) {
    log(`Erreur lors de la récupération des logs: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
  }
}

async function displayChecklist() {
  log('\n📋 Checklist de configuration Supabase Dashboard', 'info');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://genealogie-famille.vercel.app';
  console.log(`
  1. Authentication → Providers → Email
     □ Email provider activé (Enabled)
  
  2. Authentication → URL Configuration
     □ Site URL: ${siteUrl}
     □ Redirect URLs contient:
       - ${siteUrl}/reset-password
       - ${siteUrl}/reset-password/**
  
  3. Vérifier les logs Supabase
     □ Dashboard → Logs → Auth Logs
     □ Vérifier qu'il n'y a pas d'erreurs d'envoi d'email
  
  4. Vérifier les emails
     □ Boîte de réception
     □ Dossier spam/courrier indésirable
  `);
}

async function main() {
  try {
    console.log('\n🧪 Script de Test : Envoi d\'Email de Récupération de Mot de Passe\n');
    console.log('='.repeat(60));
    
    // Récupérer les arguments de la ligne de commande
    const args = process.argv.slice(2);
    const emailOrLoginArg = args[0];
    const baseUrlArg = args[1];
    
    // 1. Vérifier les variables d'environnement
    const envOk = await checkEnvironmentVariables();
    if (!envOk) {
      log('\n❌ Variables d\'environnement manquantes. Veuillez configurer .env.local', 'error');
      closeReadline();
      process.exit(1);
    }
    
    // 2. Vérifier la connexion Supabase
    const connectionOk = await checkSupabaseConnection();
    if (!connectionOk) {
      log('\n❌ Impossible de se connecter à Supabase', 'error');
      closeReadline();
      process.exit(1);
    }
    
    // 3. Afficher la checklist
    await displayChecklist();
    
    // 4. Demander l'email/login à tester
    let emailOrLogin = emailOrLoginArg;
    if (!emailOrLogin) {
      if (!rl) {
        log('\n❌ Email/login requis. Usage: npm run test:email-recovery <email|login> [baseUrl]', 'error');
        closeReadline();
        process.exit(1);
      }
      emailOrLogin = await question('\n📧 Entrez l\'email ou le login à tester : ');
    }
    
    if (!emailOrLogin || !emailOrLogin.trim()) {
      log('Email/login vide, arrêt du script', 'error');
      closeReadline();
      process.exit(0);
    }
    
    // 5. Vérifier que l'utilisateur existe
    const userInfo = await checkUserExists(emailOrLogin);
    if (!userInfo) {
      log('\n⚠️  L\'utilisateur n\'existe pas, mais le test continuera quand même', 'warning');
      log('(Supabase ne révèle pas si l\'utilisateur existe pour des raisons de sécurité)', 'info');
    }
    
    // 6. Demander l'URL de base
    let baseUrl = baseUrlArg;
    if (!baseUrl) {
      if (!rl) {
        baseUrl = 'http://localhost:3000';
      } else {
        const baseUrlInput = await question('\n🌐 URL de base (appuyez sur Entrée pour http://localhost:3000) : ');
        baseUrl = baseUrlInput.trim() || 'http://localhost:3000';
      }
    }
    
    // 7. Tester l'envoi d'email
    const testOk = await testEmailSending(emailOrLogin, baseUrl);
    
    // 8. Résumé
    console.log('\n' + '='.repeat(60));
    log('\n📊 Résumé du test', 'info');
    
    if (testOk) {
      log('✅ La requête a été envoyée avec succès', 'success');
      log('⚠️  Vérifiez maintenant:', 'warning');
      log('   1. Les logs Supabase Dashboard → Logs → Auth Logs', 'info');
      log('   2. Votre boîte email (et le dossier spam)', 'info');
      log('   3. La table password_reset_logs dans Supabase', 'info');
    } else {
      log('❌ La requête a échoué', 'error');
      log('⚠️  Vérifiez:', 'warning');
      log('   1. Que le serveur Next.js est démarré (npm run dev)', 'info');
      log('   2. Les logs du serveur pour voir l\'erreur exacte', 'info');
      log('   3. La configuration Supabase (voir checklist ci-dessus)', 'info');
    }
  } finally {
    closeReadline();
  }
}

main().catch((error) => {
  log(`Erreur fatale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
  console.error(error);
  closeReadline();
  process.exit(1);
});


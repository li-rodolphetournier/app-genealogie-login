/**
 * Script de test manuel pour le flux de réinitialisation de mot de passe
 * 
 * Usage: npm run test:password-reset
 * 
 * Ce script guide l'utilisateur à travers tous les scénarios de test
 */

import { createServiceRoleClient } from '../src/lib/supabase/server';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function testForgotPassword() {
  console.log('\n📧 Test 1 : Demande de réinitialisation\n');
  
  const emailOrLogin = await question('Entrez un email ou login : ');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        emailOrLogin.includes('@') 
          ? { email: emailOrLogin }
          : { login: emailOrLogin }
      ),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Succès :', data.message);
    } else {
      console.log('❌ Erreur :', data.error);
    }
  } catch (error) {
    console.error('❌ Erreur de connexion :', error);
  }
}

async function testChangePassword() {
  console.log('\n🔐 Test 2 : Changement de mot de passe (nécessite une session)\n');
  
  console.log('⚠️  Ce test nécessite d\'être connecté.');
  console.log('Pour tester manuellement :');
  console.log('1. Connectez-vous sur http://localhost:3000');
  console.log('2. Allez sur http://localhost:3000/admin');
  console.log('3. Remplissez le formulaire "Modifier le mot de passe"');
  console.log('4. Vérifiez que le changement fonctionne\n');
}

async function testAdminResetPassword() {
  console.log('\n👤 Test 3 : Réinitialisation par admin\n');
  
  const userLogin = await question('Entrez le login de l\'utilisateur à réinitialiser : ');
  
  console.log('\n⚠️  Ce test nécessite d\'être connecté en tant qu\'administrateur.');
  console.log('Pour tester manuellement :');
  console.log('1. Connectez-vous en tant qu\'admin');
  console.log('2. Utilisez cette commande curl (remplacez SESSION_COOKIE) :');
  console.log(`
curl -X POST http://localhost:3000/api/auth/admin/reset-password \\
  -H "Content-Type: application/json" \\
  -H "Cookie: your-session-cookie" \\
  -d '{
    "userLogin": "${userLogin}",
    "reason": "Test de réinitialisation"
  }'
  `);
}

async function checkSupabaseConfig() {
  console.log('\n⚙️  Vérification de la configuration Supabase\n');
  
  try {
    const supabase = await createServiceRoleClient();
    
    // Vérifier la connexion
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log('❌ Erreur de connexion Supabase :', error.message);
    } else {
      console.log('✅ Connexion Supabase OK');
    }
    
    console.log('\n📋 Checklist de configuration :');
    console.log('□ Email Auth activé dans Supabase Dashboard');
    console.log('□ URLs de redirection configurées :');
    console.log('  - http://localhost:3000/reset-password');
    console.log('  - https://votre-domaine.com/reset-password');
    console.log('□ Template email personnalisé (optionnel)');
    console.log('□ Variables d\'environnement configurées');
    
  } catch (error) {
    console.error('❌ Erreur :', error);
  }
}

async function main() {
  console.log('🧪 Script de Test : Réinitialisation de Mot de Passe\n');
  console.log('Ce script vous guide à travers les tests manuels.\n');
  
  const choice = await question(`
Choisissez un test :
1. Test demande de réinitialisation (forgot-password)
2. Test changement de mot de passe (change-password)
3. Test réinitialisation par admin
4. Vérifier configuration Supabase
5. Tous les tests
0. Quitter

Votre choix : `);
  
  switch (choice.trim()) {
    case '1':
      await testForgotPassword();
      break;
    case '2':
      await testChangePassword();
      break;
    case '3':
      await testAdminResetPassword();
      break;
    case '4':
      await checkSupabaseConfig();
      break;
    case '5':
      await checkSupabaseConfig();
      await testForgotPassword();
      await testChangePassword();
      await testAdminResetPassword();
      break;
    case '0':
      console.log('\nAu revoir !');
      rl.close();
      process.exit(0);
      break;
    default:
      console.log('\n❌ Choix invalide');
  }
  
  rl.close();
}

main().catch(console.error);


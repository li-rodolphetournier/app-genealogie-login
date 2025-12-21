/**
 * Script pour créer un compte Supabase Auth pour un utilisateur spécifique
 * 
 * Usage:
 *   npx tsx scripts/create-auth-for-single-user.ts <email> <password>
 * 
 * Exemple:
 *   npx tsx scripts/create-auth-for-single-user.ts poissonmg@hotmail.com MonMotDePasse123!
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Charger .env.local avant de lire les variables
const envPath = resolve(process.cwd(), '.env.local');
const result = config({ path: envPath });

if (result.error) {
  console.warn(`⚠️  Impossible de charger .env.local: ${result.error.message}`);
  console.warn('   Tentative de chargement depuis les variables d\'environnement système...');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Trouvé' : '❌ Manquant');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Trouvé' : '❌ Manquant');
  process.exit(1);
}

// Client Supabase avec service role key (accès admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, login, email, status')
    .eq('email', email)
    .single();

  if (error) {
    console.error('❌ Erreur lors de la recherche de l\'utilisateur:', error);
    return null;
  }

  return data;
}

async function checkAuthUserExists(userId: string) {
  const { data: authUsersData, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return false;
  }

  return authUsersData?.users?.some(u => u.id === userId) || false;
}

async function createAuthUser(userId: string, email: string, password: string, login: string, status: string) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      id: userId, // Utiliser l'UUID du profil
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        login: login,
        status: status,
      },
    });

    if (error) {
      console.error(`❌ Erreur lors de la création:`, error.message);
      return false;
    }

    console.log(`✅ Compte auth créé avec succès pour: ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Erreur inattendue:`, error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Usage: npx tsx scripts/create-auth-for-single-user.ts <email> <password>');
    console.error('   Exemple: npx tsx scripts/create-auth-for-single-user.ts poissonmg@hotmail.com MonMotDePasse123!');
    process.exit(1);
  }

  const email = args[0];
  const password = args[1];

  console.log(`🔍 Recherche de l'utilisateur: ${email}\n`);

  // Trouver l'utilisateur dans public.users
  const user = await findUserByEmail(email);

  if (!user) {
    console.error(`❌ Utilisateur non trouvé dans public.users avec l'email: ${email}`);
    process.exit(1);
  }

  console.log(`✅ Utilisateur trouvé:`);
  console.log(`   - ID: ${user.id}`);
  console.log(`   - Login: ${user.login}`);
  console.log(`   - Email: ${user.email}`);
  console.log(`   - Status: ${user.status}\n`);

  // Vérifier si le compte auth existe déjà
  const authExists = await checkAuthUserExists(user.id);

  if (authExists) {
    console.log(`⚠️  Un compte auth existe déjà pour cet utilisateur (ID: ${user.id})`);
    console.log(`   Si tu veux changer le mot de passe, utilise le dashboard Supabase ou la fonctionnalité de réinitialisation.`);
    process.exit(0);
  }

  console.log(`📝 Création du compte auth...\n`);

  // Créer le compte auth
  const success = await createAuthUser(user.id, user.email, password, user.login, user.status);

  if (success) {
    console.log(`\n✅ Compte auth créé avec succès !`);
    console.log(`\n🔑 L'utilisateur peut maintenant se connecter avec:`);
    console.log(`   - Email: ${email}`);
    console.log(`   - Mot de passe: ${password}`);
    console.log(`\n⚠️  IMPORTANT: Demande à l'utilisateur de changer son mot de passe lors de la première connexion.`);
  } else {
    console.error(`\n❌ Échec de la création du compte auth.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});


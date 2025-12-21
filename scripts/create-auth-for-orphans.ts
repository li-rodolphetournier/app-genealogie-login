/**
 * Script pour créer des comptes Supabase Auth pour les profils orphelins
 * 
 * Usage:
 *   npx tsx scripts/create-auth-for-orphans.ts
 * 
 * Prérequis:
 *   - Variables d'environnement SUPABASE_SERVICE_ROLE_KEY configurée
 *   - Package @supabase/supabase-js installé
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
  console.error('\n💡 Vérifie que le fichier .env.local existe et contient ces variables.');
  console.error(`   Chemin recherché: ${envPath}`);
  process.exit(1);
}

// Client Supabase avec service role key (accès admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface OrphanProfile {
  id: string;
  login: string;
  email: string;
  status: string;
}

async function getOrphanProfiles(): Promise<OrphanProfile[]> {
  // Récupérer tous les utilisateurs de public.users
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('id, login, email, status');

  if (usersError) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
    throw usersError;
  }

  if (!allUsers || allUsers.length === 0) {
    return [];
  }

  // Récupérer tous les utilisateurs de auth.users
  const { data: authUsersData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Erreur lors de la récupération des comptes auth:', authError);
    throw authError;
  }

  // Créer un Set des IDs des utilisateurs auth pour une recherche rapide
  const authUserIds = new Set(authUsersData?.users?.map(u => u.id) || []);

  // Filtrer les profils qui n'ont pas de compte auth correspondant
  const orphans = allUsers.filter(user => !authUserIds.has(user.id));

  return orphans;
}

async function createAuthUser(profile: OrphanProfile, password: string): Promise<boolean> {
  try {
    // Créer l'utilisateur dans Supabase Auth avec l'UUID spécifique
    const { data, error } = await supabase.auth.admin.createUser({
      id: profile.id, // Utiliser l'UUID du profil
      email: profile.email,
      password: password,
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        login: profile.login,
        status: profile.status,
      },
    });

    if (error) {
      console.error(`❌ Erreur pour ${profile.email}:`, error.message);
      return false;
    }

    console.log(`✅ Compte auth créé pour: ${profile.email} (${profile.login})`);
    return true;
  } catch (error: any) {
    console.error(`❌ Erreur inattendue pour ${profile.email}:`, error.message);
    return false;
  }
}

async function generatePassword(): Promise<string> {
  // Générer un mot de passe aléatoire sécurisé
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const length = 16;
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function main() {
  console.log('🔍 Recherche des profils orphelins...\n');

  const orphans = await getOrphanProfiles();

  if (orphans.length === 0) {
    console.log('✅ Aucun profil orphelin trouvé !');
    return;
  }

  console.log(`⚠️  ${orphans.length} profil(s) orphelin(s) trouvé(s):\n`);
  orphans.forEach((orphan, index) => {
    console.log(`   ${index + 1}. ${orphan.login} (${orphan.email}) - ${orphan.status}`);
  });

  console.log('\n📝 Les mots de passe générés seront affichés à la fin.\n');

  const passwords: Array<{ email: string; password: string }> = [];
  let successCount = 0;
  let errorCount = 0;

  for (const orphan of orphans) {
    const password = await generatePassword();
    const success = await createAuthUser(orphan, password);

    if (success) {
      passwords.push({ email: orphan.email, password });
      successCount++;
    } else {
      errorCount++;
    }

    // Petite pause pour éviter de surcharger l'API
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(60));
  console.log(`✅ Comptes créés avec succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);

  if (passwords.length > 0) {
    console.log('\n🔑 MOTS DE PASSE GÉNÉRÉS:');
    console.log('='.repeat(60));
    passwords.forEach(({ email, password }) => {
      console.log(`${email}: ${password}`);
    });
    console.log('\n⚠️  IMPORTANT: Sauvegarde ces mots de passe et demande aux utilisateurs de les changer lors de leur première connexion !');
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});


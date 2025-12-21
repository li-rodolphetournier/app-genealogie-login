/**
 * Script pour réinitialiser le mot de passe d'un utilisateur
 * 
 * Usage:
 *   npx tsx scripts/reset-user-password.ts <email> <nouveau-mot-de-passe>
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Charger .env.local
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Usage: npx tsx scripts/reset-user-password.ts <email> <nouveau-mot-de-passe>');
    console.error('   Exemple: npx tsx scripts/reset-user-password.ts poissonmg@hotmail.com MonNouveauMotDePasse123!');
    process.exit(1);
  }

  const email = args[0];
  const newPassword = args[1];

  if (newPassword.length < 6) {
    console.error('❌ Le mot de passe doit contenir au moins 6 caractères');
    process.exit(1);
  }

  console.log(`🔍 Recherche de l'utilisateur: ${email}\n`);

  // Vérifier dans public.users
  const { data: publicUser, error: publicError } = await supabase
    .from('users')
    .select('id, login, email')
    .eq('email', email)
    .single();

  if (publicError || !publicUser) {
    console.error(`❌ Utilisateur non trouvé dans public.users avec l'email: ${email}`);
    process.exit(1);
  }

  console.log(`✅ Utilisateur trouvé:`);
  console.log(`   - ID: ${publicUser.id}`);
  console.log(`   - Login: ${publicUser.login}`);
  console.log(`   - Email: ${publicUser.email}\n`);

  // Vérifier dans auth.users
  const { data: authUsersData, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error(`❌ Erreur lors de la récupération des utilisateurs auth:`, authError);
    process.exit(1);
  }

  const authUser = authUsersData?.users?.find(u => u.id === publicUser.id);

  if (!authUser) {
    console.error(`❌ Aucun compte auth trouvé pour cet utilisateur`);
    console.error(`💡 Exécute d'abord: npx tsx scripts/create-auth-for-single-user.ts ${email} ${newPassword}`);
    process.exit(1);
  }

  console.log(`📝 Réinitialisation du mot de passe...\n`);

  // Mettre à jour le mot de passe
  const { data, error } = await supabase.auth.admin.updateUserById(
    publicUser.id,
    {
      password: newPassword,
    }
  );

  if (error) {
    console.error(`❌ Erreur lors de la réinitialisation:`, error.message);
    process.exit(1);
  }

  console.log(`✅ Mot de passe réinitialisé avec succès !\n`);
  console.log(`🔑 L'utilisateur peut maintenant se connecter avec:`);
  console.log(`   - Email: ${email}`);
  console.log(`   - Login: ${publicUser.login}`);
  console.log(`   - Nouveau mot de passe: ${newPassword}\n`);
  console.log(`⚠️  IMPORTANT: Demande à l'utilisateur de changer son mot de passe lors de la première connexion.`);
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});


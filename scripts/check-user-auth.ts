/**
 * Script pour vérifier l'état d'un utilisateur dans auth.users et public.users
 * 
 * Usage:
 *   npx tsx scripts/check-user-auth.ts <email>
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
  
  if (args.length < 1) {
    console.error('❌ Usage: npx tsx scripts/check-user-auth.ts <email>');
    process.exit(1);
  }

  const email = args[0];

  console.log(`🔍 Vérification de l'utilisateur: ${email}\n`);

  // Vérifier dans public.users
  const { data: publicUser, error: publicError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (publicError || !publicUser) {
    console.error(`❌ Utilisateur non trouvé dans public.users`);
    process.exit(1);
  }

  console.log(`✅ Utilisateur trouvé dans public.users:`);
  console.log(`   - ID: ${publicUser.id}`);
  console.log(`   - Login: ${publicUser.login}`);
  console.log(`   - Email: ${publicUser.email}`);
  console.log(`   - Status: ${publicUser.status}\n`);

  // Vérifier dans auth.users
  const { data: authUsersData, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error(`❌ Erreur lors de la récupération des utilisateurs auth:`, authError);
    process.exit(1);
  }

  const authUser = authUsersData?.users?.find(u => u.id === publicUser.id);
  const authUserByEmail = authUsersData?.users?.find(u => u.email === email);

  if (authUser) {
    console.log(`✅ Compte auth trouvé (par ID):`);
    console.log(`   - ID: ${authUser.id}`);
    console.log(`   - Email: ${authUser.email}`);
    console.log(`   - Email confirmé: ${authUser.email_confirmed_at ? '✅ Oui' : '❌ Non'}`);
    console.log(`   - Dernière connexion: ${authUser.last_sign_in_at || 'Jamais'}`);
    console.log(`   - Créé le: ${authUser.created_at}\n`);

    if (authUser.email !== email) {
      console.log(`⚠️  ATTENTION: L'email dans auth.users (${authUser.email}) est différent de celui dans public.users (${email})`);
    }
  } else if (authUserByEmail) {
    console.log(`⚠️  Compte auth trouvé par email mais avec un ID différent:`);
    console.log(`   - ID dans auth.users: ${authUserByEmail.id}`);
    console.log(`   - ID dans public.users: ${publicUser.id}`);
    console.log(`   - Email: ${authUserByEmail.email}\n`);
    console.log(`❌ PROBLÈME: Les IDs ne correspondent pas !`);
  } else {
    console.log(`❌ Aucun compte auth trouvé pour cet utilisateur\n`);
    console.log(`💡 Solution: Exécute le script create-auth-for-single-user.ts pour créer le compte auth.`);
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});


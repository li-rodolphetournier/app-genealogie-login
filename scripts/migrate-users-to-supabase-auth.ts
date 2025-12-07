/**
 * Script de migration des utilisateurs vers Supabase Auth
 * 
 * Ce script :
 * 1. Lit les utilisateurs depuis users.json
 * 2. Crée chaque utilisateur dans Supabase Auth
 * 3. Crée ou met à jour le profil dans la table users
 * 
 * Usage: npm run migrate:auth
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur : Variables d\'environnement Supabase manquantes');
  console.error('Assurez-vous que .env.local contient :');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type UserJSON = {
  login: string;
  password: string;
  email: string;
  description?: string;
  detail?: string;
  profileImage?: string;
  status: 'administrateur' | 'utilisateur' | 'redacteur';
  id?: string;
};

async function migrateUsers() {
  console.log('🚀 Démarrage de la migration vers Supabase Auth...\n');

  const usersPath = path.join(process.cwd(), 'src/data/users.json');
  
  if (!fs.existsSync(usersPath)) {
    console.error(`❌ Fichier non trouvé : ${usersPath}`);
    process.exit(1);
  }

  const users: UserJSON[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  
  if (users.length === 0) {
    console.log('⚠️  Aucun utilisateur à migrer');
    return;
  }

  console.log(`📦 ${users.length} utilisateur(s) trouvé(s)\n`);

  const results = {
    success: 0,
    skipped: 0,
    errors: 0,
  };

  for (const user of users) {
    try {
      console.log(`\n📝 Traitement de "${user.login}"...`);

      // Vérifier si l'utilisateur existe déjà dans Supabase Auth
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(
        (u) => u.email === user.email || u.user_metadata?.login === user.login
      );

      if (existingUser) {
        console.log(`   ⏭️  Utilisateur "${user.login}" existe déjà (ID: ${existingUser.id})`);
        
        // Supprimer les conflits potentiels (profils avec le même login/email mais ID différent)
        await supabase
          .from('users')
          .delete()
          .eq('login', user.login)
          .neq('id', existingUser.id);

        await supabase
          .from('users')
          .delete()
          .eq('email', user.email)
          .neq('id', existingUser.id);
        
        // Mettre à jour le profil dans la table users si elle existe
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: existingUser.id,
            login: user.login,
            email: user.email,
            status: user.status,
            description: user.description || null,
            detail: user.detail || null,
            profile_image: user.profileImage || null,
          }, {
            onConflict: 'id',
          });

        if (profileError) {
          console.log(`   ⚠️  Erreur lors de la mise à jour du profil : ${profileError.message}`);
        } else {
          console.log(`   ✅ Profil mis à jour dans la table users`);
        }

        results.skipped++;
        continue;
      }

          // Créer l'utilisateur dans Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password, // Supabase hash automatiquement
            email_confirm: true, // Confirmer l'email automatiquement
            user_metadata: {
              login: user.login,
              status: user.status,
            },
          });

          if (authError) {
            console.error(`   ❌ Erreur lors de la création dans Auth : ${authError.message}`);
            console.error(`   📋 Détails :`, JSON.stringify(authError, null, 2));
            if (authError.message?.includes('already registered')) {
              console.log(`   ⚠️  L'email "${user.email}" est déjà enregistré. Tentative de mise à jour...`);
              // Essayer de trouver l'utilisateur existant
              const { data: existingUsers } = await supabase.auth.admin.listUsers();
              const existingUser = existingUsers.users.find((u) => u.email === user.email);
              if (existingUser) {
                console.log(`   ✅ Utilisateur trouvé (ID: ${existingUser.id}), mise à jour du profil...`);
                
                // Supprimer les conflits potentiels
                await supabase
                  .from('users')
                  .delete()
                  .eq('login', user.login)
                  .neq('id', existingUser.id);

                await supabase
                  .from('users')
                  .delete()
                  .eq('email', user.email)
                  .neq('id', existingUser.id);
                
                // Mettre à jour le profil dans la table users
                const { error: profileError } = await supabase
                  .from('users')
                  .upsert({
                    id: existingUser.id,
                    login: user.login,
                    email: user.email,
                    status: user.status,
                    description: user.description || null,
                    detail: user.detail || null,
                    profile_image: user.profileImage || null,
                  }, {
                    onConflict: 'id',
                  });

                if (profileError) {
                  console.error(`   ⚠️  Erreur lors de la mise à jour du profil : ${profileError.message}`);
                } else {
                  console.log(`   ✅ Profil mis à jour dans la table users`);
                  results.success++;
                  continue;
                }
              }
            }
            results.errors++;
            continue;
          }

      if (!authData.user) {
        console.error(`   ❌ Aucun utilisateur créé pour "${user.login}"`);
        results.errors++;
        continue;
      }

      console.log(`   ✅ Utilisateur créé dans Auth (ID: ${authData.user.id})`);

      // Vérifier si un profil existe déjà pour cet ID (créé par le trigger)
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id, login, email')
        .eq('id', authData.user.id)
        .single();

      // Si un profil existe avec un login/email différent, on doit le mettre à jour
      // Mais d'abord, supprimer les conflits potentiels (profils avec le même login/email mais ID différent)
      if (existingProfile) {
        // Supprimer les profils avec le même login mais ID différent
        await supabase
          .from('users')
          .delete()
          .eq('login', user.login)
          .neq('id', authData.user.id);

        // Supprimer les profils avec le même email mais ID différent
        await supabase
          .from('users')
          .delete()
          .eq('email', user.email)
          .neq('id', authData.user.id);
      }

      // Créer ou mettre à jour le profil dans la table users
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          login: user.login,
          email: user.email,
          status: user.status,
          description: user.description || null,
          detail: user.detail || null,
          profile_image: user.profileImage || null,
        }, {
          onConflict: 'id',
        });

      if (profileError) {
        console.error(`   ⚠️  Erreur lors de la création du profil : ${profileError.message}`);
        console.error(`   💡 Assurez-vous que la table 'users' existe dans Supabase`);
      } else {
        console.log(`   ✅ Profil créé/mis à jour dans la table users`);
      }

      results.success++;
    } catch (error: any) {
      console.error(`   ❌ Erreur inattendue pour "${user.login}":`, error.message);
      results.errors++;
    }
  }

  // Résumé
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Résumé de la migration :');
  console.log(`   ✅ Succès : ${results.success}`);
  console.log(`   ⏭️  Ignorés (déjà existants) : ${results.skipped}`);
  console.log(`   ❌ Erreurs : ${results.errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (results.errors === 0) {
    console.log('🎉 Migration terminée avec succès !');
  } else {
    console.log('⚠️  Migration terminée avec des erreurs. Vérifiez les logs ci-dessus.');
  }
}

// Exécuter la migration
migrateUsers()
  .then(() => {
    console.log('\n✨ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale :', error);
    process.exit(1);
  });


/**
 * Script de migration des données JSON vers Supabase
 * 
 * Usage:
 *   npm run migrate:supabase
 *   ou
 *   npx tsx scripts/migrate-to-supabase.ts
 * 
 * Prerequisites:
 *   - Variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY configurées
 *   - Schéma SQL exécuté dans Supabase
 */

// Charger les variables d'environnement depuis .env.local
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

// Types
type UserJSON = {
  id?: string;
  login: string;
  password: string;
  email: string;
  status: 'administrateur' | 'utilisateur' | 'redacteur';
  profileImage?: string;
  description?: string;
  detail?: string;
};

type ObjectJSON = {
  id: string;
  nom: string;
  type: string;
  status: 'publie' | 'brouillon';
  utilisateur: string;
  description?: string;
  longDescription?: string;
  photos?: Array<{
    url: string;
    description: string[];
  }>;
};

type MessageJSON = {
  id: string;
  title: string;
  content: string;
  images: string[];
  date: string;
  userName: string;
};

type PersonJSON = {
  id: string;
  nom: string;
  prenom: string;
  genre: 'homme' | 'femme';
  description: string;
  detail?: string;
  mere: string | null;
  pere: string | null;
  ordreNaissance: number;
  dateNaissance: string;
  dateDeces: string | null;
  image: string | null;
};

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erreur: SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Chemins vers les fichiers JSON
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const OBJECTS_FILE = path.join(DATA_DIR, 'objects.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const GENEALOGY_FILE = path.join(DATA_DIR, 'genealogie.json');

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function readJSONFile<T>(filePath: string): T[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T[];
  } catch (error) {
    console.error(`❌ Erreur lecture ${filePath}:`, error);
    return [];
  }
}

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// ============================================
// MIGRATION USERS
// ============================================

async function migrateUsers(): Promise<Map<string, string>> {
  console.log('\n📦 Migration des utilisateurs...');
  
  const users = readJSONFile<UserJSON>(USERS_FILE);
  const loginToIdMap = new Map<string, string>();

  if (users.length === 0) {
    console.log('⚠️  Aucun utilisateur trouvé');
    return loginToIdMap;
  }

  for (const user of users) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('login', user.login)
        .single();

      if (existingUser) {
        console.log(`⏭️  Utilisateur "${user.login}" existe déjà, skip`);
        loginToIdMap.set(user.login, existingUser.id);
        continue;
      }

      // Hasher le mot de passe
      const passwordHash = await hashPassword(user.password);

      // Insérer l'utilisateur
      const { data, error } = await supabase
        .from('users')
        .insert({
          login: user.login,
          email: user.email,
          password_hash: passwordHash,
          status: user.status,
          profile_image: user.profileImage || null,
          description: user.description || null,
          detail: user.detail || null,
        })
        .select('id')
        .single();

      if (error) {
        console.error(`❌ Erreur insertion utilisateur "${user.login}":`, error.message);
        continue;
      }

      if (data) {
        loginToIdMap.set(user.login, data.id);
        console.log(`✅ Utilisateur "${user.login}" migré (ID: ${data.id})`);
      }
    } catch (error) {
      console.error(`❌ Erreur traitement utilisateur "${user.login}":`, error);
    }
  }

  console.log(`✅ Migration utilisateurs terminée: ${loginToIdMap.size}/${users.length}`);
  return loginToIdMap;
}

// ============================================
// MIGRATION OBJECTS
// ============================================

async function migrateObjects(loginToIdMap: Map<string, string>): Promise<void> {
  console.log('\n📦 Migration des objets...');
  
  const objects = readJSONFile<ObjectJSON>(OBJECTS_FILE);

  if (objects.length === 0) {
    console.log('⚠️  Aucun objet trouvé');
    return;
  }

  let successCount = 0;

  for (const object of objects) {
    try {
      const userId = loginToIdMap.get(object.utilisateur);

      // Insérer l'objet
      const { data: insertedObject, error: objectError } = await supabase
        .from('objects')
        .insert({
          id: object.id,
          nom: object.nom,
          type: object.type,
          status: object.status,
          utilisateur_id: userId || null,
          description: object.description || null,
          long_description: object.longDescription || null,
        })
        .select('id')
        .single();

      if (objectError) {
        console.error(`❌ Erreur insertion objet "${object.nom}":`, objectError.message);
        continue;
      }

      // Insérer les photos
      if (object.photos && object.photos.length > 0) {
        const photosToInsert = object.photos.map((photo, index) => ({
          object_id: object.id,
          url: photo.url,
          description: photo.description || [],
          display_order: index,
        }));

        const { error: photosError } = await supabase
          .from('object_photos')
          .insert(photosToInsert);

        if (photosError) {
          console.error(`⚠️  Erreur insertion photos pour "${object.nom}":`, photosError.message);
        }
      }

      successCount++;
      console.log(`✅ Objet "${object.nom}" migré (${object.photos?.length || 0} photos)`);
    } catch (error) {
      console.error(`❌ Erreur traitement objet "${object.nom}":`, error);
    }
  }

  console.log(`✅ Migration objets terminée: ${successCount}/${objects.length}`);
}

// ============================================
// MIGRATION MESSAGES
// ============================================

async function migrateMessages(loginToIdMap: Map<string, string>): Promise<void> {
  console.log('\n📦 Migration des messages...');
  
  const messages = readJSONFile<MessageJSON>(MESSAGES_FILE);

  if (messages.length === 0) {
    console.log('⚠️  Aucun message trouvé');
    return;
  }

  let successCount = 0;

  for (const message of messages) {
    try {
      const userId = loginToIdMap.get(message.userName);

      // Convertir la date
      const createdAt = message.date ? new Date(message.date).toISOString() : new Date().toISOString();

      // Insérer le message
      const { data: insertedMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          id: message.id,
          title: message.title,
          content: message.content,
          user_id: userId || null,
          created_at: createdAt,
        })
        .select('id')
        .single();

      if (messageError) {
        console.error(`❌ Erreur insertion message "${message.title}":`, messageError.message);
        continue;
      }

      // Insérer les images
      if (message.images && message.images.length > 0) {
        const imagesToInsert = message.images.map((imageUrl, index) => ({
          message_id: message.id,
          url: imageUrl,
          display_order: index,
        }));

        const { error: imagesError } = await supabase
          .from('message_images')
          .insert(imagesToInsert);

        if (imagesError) {
          console.error(`⚠️  Erreur insertion images pour "${message.title}":`, imagesError.message);
        }
      }

      successCount++;
      console.log(`✅ Message "${message.title}" migré (${message.images?.length || 0} images)`);
    } catch (error) {
      console.error(`❌ Erreur traitement message "${message.title}":`, error);
    }
  }

  console.log(`✅ Migration messages terminée: ${successCount}/${messages.length}`);
}

// ============================================
// MIGRATION PERSONS (GENEALOGIE)
// ============================================

async function migratePersons(): Promise<void> {
  console.log('\n📦 Migration des personnes (généalogie)...');
  
  const persons = readJSONFile<PersonJSON>(GENEALOGY_FILE);

  if (persons.length === 0) {
    console.log('⚠️  Aucune personne trouvée');
    return;
  }

  // Trier par ordre de dépendance (les parents avant les enfants)
  const personsMap = new Map(persons.map(p => [p.id, p]));
  const sortedPersons: PersonJSON[] = [];
  const processed = new Set<string>();

  function addPersonIfReady(person: PersonJSON) {
    if (processed.has(person.id)) return;

    // Vérifier si les parents sont déjà traités ou n'existent pas
    const parentReady = (!person.mere || processed.has(person.mere)) && 
                        (!person.pere || processed.has(person.pere));

    if (parentReady) {
      sortedPersons.push(person);
      processed.add(person.id);
    }
  }

  // Plusieurs passes pour gérer les dépendances
  while (processed.size < persons.length) {
    const beforeSize = processed.size;
    persons.forEach(person => addPersonIfReady(person));
    
    if (processed.size === beforeSize) {
      // Boucle détectée, ajouter quand même
      persons.forEach(person => {
        if (!processed.has(person.id)) {
          sortedPersons.push(person);
          processed.add(person.id);
        }
      });
      break;
    }
  }

  let successCount = 0;

  for (const person of sortedPersons) {
    try {
      const { error } = await supabase
        .from('persons')
        .insert({
          id: person.id,
          nom: person.nom,
          prenom: person.prenom,
          genre: person.genre,
          description: person.description || '',
          detail: person.detail || null,
          mere_id: person.mere || null,
          pere_id: person.pere || null,
          ordre_naissance: person.ordreNaissance || 1,
          date_naissance: person.dateNaissance || null,
          date_deces: person.dateDeces || null,
          image: person.image || null,
        });

      if (error) {
        console.error(`❌ Erreur insertion personne "${person.prenom} ${person.nom}":`, error.message);
        continue;
      }

      successCount++;
      console.log(`✅ Personne "${person.prenom} ${person.nom}" migrée`);
    } catch (error) {
      console.error(`❌ Erreur traitement personne "${person.prenom} ${person.nom}":`, error);
    }
  }

  console.log(`✅ Migration personnes terminée: ${successCount}/${persons.length}`);
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

async function main() {
  console.log('🚀 Début de la migration vers Supabase\n');
  console.log(`📡 URL Supabase: ${SUPABASE_URL}\n`);

  try {
    // 1. Migration des utilisateurs (nécessaire pour les relations)
    const loginToIdMap = await migrateUsers();

    // 2. Migration des objets
    await migrateObjects(loginToIdMap);

    // 3. Migration des messages
    await migrateMessages(loginToIdMap);

    // 4. Migration des personnes (généalogie)
    await migratePersons();

    console.log('\n✅ Migration terminée avec succès!');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Vérifier les données dans Supabase Dashboard');
    console.log('   2. Mettre à jour les API routes pour utiliser Supabase');
    console.log('   3. Tester l\'application');
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration
main().catch(console.error);


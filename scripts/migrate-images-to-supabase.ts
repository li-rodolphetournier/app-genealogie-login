/**
 * Script de migration des images locales vers Supabase Storage
 * 
 * Ce script :
 * 1. Parcourt toutes les tables contenant des URLs d'images
 * 2. Détecte les URLs locales (/uploads/...)
 * 3. Télécharge les images depuis les URLs locales (si disponibles)
 * 4. Les upload vers le bon bucket Supabase
 * 5. Met à jour les URLs dans la base de données
 * 
 * Usage: npm run migrate:images
 */

// Charger les variables d'environnement depuis .env.local
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { existsSync } from 'fs';
import { join } from 'path';
import { readFile } from 'fs/promises';

// Fetch global pour Node.js (disponible depuis Node.js 18+)
const globalFetch = typeof fetch !== 'undefined' ? fetch : require('node-fetch');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('   Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies dans .env.local');
  console.error(`   Fichier .env.local trouvé: ${existsSync(resolve(process.cwd(), '.env.local')) ? 'Oui' : 'Non'}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mapping des types d'images vers les buckets
const IMAGE_TYPE_TO_BUCKET: Record<string, string> = {
  'users': 'users',
  'objects': 'objects',
  'messages': 'messages',
  'genealogy': 'genealogy',
  'login': 'uploads',
};

/**
 * Détecte le type d'image à partir de l'URL
 */
function detectImageType(url: string): string {
  if (url.includes('/users/')) return 'users';
  if (url.includes('/objects/')) return 'objects';
  if (url.includes('/messages/')) return 'messages';
  if (url.includes('/genealogie/') || url.includes('/genealogy/')) return 'genealogy';
  if (url.includes('/login/')) return 'login';
  return 'uploads'; // Par défaut
}

/**
 * Télécharge une image depuis une URL locale ou externe
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    // Si c'est une URL locale
    if (url.startsWith('/uploads/')) {
      // Essayer plusieurs chemins possibles
      const possiblePaths = [
        join(process.cwd(), 'public', url), // public/uploads/...
        join(process.cwd(), url.substring(1)), // uploads/... (si pas dans public)
        join(process.cwd(), 'uploads', url.replace('/uploads/', '')), // uploads/...
      ];

      for (const localPath of possiblePaths) {
        if (existsSync(localPath)) {
          console.log(`📁 Fichier trouvé: ${localPath}`);
          return await readFile(localPath);
        }
      }

      // Si le fichier local n'existe pas, essayer de télécharger depuis l'URL complète
      // (par exemple si le serveur local est en cours d'exécution)
      const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
      try {
        const response = await globalFetch(fullUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          console.log(`🌐 Image téléchargée depuis: ${fullUrl}`);
          return Buffer.from(arrayBuffer);
        }
      } catch (fetchError) {
        // Ignorer les erreurs de fetch pour les URLs locales
      }

      console.warn(`⚠️  Fichier local non trouvé dans: ${possiblePaths.join(', ')}`);
      return null;
    }

    // Si c'est une URL externe (déjà sur Supabase ou autre)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Si c'est déjà une URL Supabase, ne pas re-uploader
      if (url.includes('supabase.co/storage')) {
        console.log(`ℹ️  Image déjà sur Supabase: ${url}`);
        return null;
      }

      // Télécharger depuis l'URL externe
      const response = await globalFetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
      console.warn(`⚠️  Impossible de télécharger: ${url}`);
      return null;
    }

    return null;
  } catch (error) {
    console.error(`❌ Erreur lors du téléchargement de ${url}:`, error);
    return null;
  }
}

/**
 * Upload une image vers Supabase Storage
 */
async function uploadToSupabase(
  buffer: Buffer,
  fileName: string,
  bucket: string
): Promise<string | null> {
  try {
    // S'assurer que le bucket existe
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === bucket);

    if (!bucketExists) {
      console.log(`📦 Création du bucket ${bucket}...`);
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'],
      });

      if (createError) {
        console.error(`❌ Erreur création bucket ${bucket}:`, createError);
        return null;
      }
    }

    // Upload du fichier
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg', // Par défaut, ajuster selon l'extension
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      console.error(`❌ Erreur upload vers ${bucket}/${fileName}:`, error);
      return null;
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    console.log(`✅ Upload réussi: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Erreur lors de l'upload:`, error);
    return null;
  }
}

/**
 * Extrait le nom de fichier d'une URL
 */
function extractFileName(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] || `image-${Date.now()}.jpg`;
}

/**
 * Génère un nom de fichier unique
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const extension = originalName.split('.').pop() || 'jpg';
  return `${timestamp}-${random}.${extension}`;
}

/**
 * Migre les images de la table users
 */
async function migrateUsersImages() {
  console.log('\n📸 Migration des images de profil des utilisateurs...');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, login, profile_image')
    .not('profile_image', 'is', null);

  if (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('ℹ️  Aucune image de profil à migrer');
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  let notFound = 0;

  for (const user of users) {
    if (!user.profile_image) continue;

    // Si déjà sur Supabase, ignorer
    if (user.profile_image.includes('supabase.co/storage')) {
      console.log(`⏭️  ${user.login}: Image déjà sur Supabase`);
      skipped++;
      continue;
    }

    console.log(`\n🔄 Migration de ${user.login}...`);

    console.log(`   URL actuelle: ${user.profile_image}`);

    // Télécharger l'image
    const buffer = await downloadImage(user.profile_image);
    if (!buffer) {
      console.warn(`⚠️  Impossible de télécharger l'image de ${user.login} (fichier non trouvé)`);
      notFound++;
      continue;
    }

    // Déterminer le bucket
    const imageType = detectImageType(user.profile_image);
    const bucket = IMAGE_TYPE_TO_BUCKET[imageType] || 'users';

    // Générer un nom de fichier unique
    const originalName = extractFileName(user.profile_image);
    const fileName = generateUniqueFileName(originalName);

    // Upload vers Supabase
    const newUrl = await uploadToSupabase(buffer, fileName, bucket);
    if (!newUrl) {
      errors++;
      continue;
    }

    // Mettre à jour la base de données
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_image: newUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error(`❌ Erreur mise à jour ${user.login}:`, updateError);
      errors++;
    } else {
      console.log(`✅ ${user.login} migré: ${newUrl}`);
      migrated++;
    }
  }

  console.log(`\n📊 Résultat users: ${migrated} migrés, ${skipped} ignorés, ${notFound} fichiers introuvables, ${errors} erreurs`);
}

/**
 * Migre les images des objets (object_photos)
 */
async function migrateObjectsImages() {
  console.log('\n📸 Migration des images des objets...');
  
  const { data: photos, error } = await supabase
    .from('object_photos')
    .select('id, object_id, url');

  if (error) {
    console.error('❌ Erreur lors de la récupération des photos d\'objets:', error);
    return;
  }

  if (!photos || photos.length === 0) {
    console.log('ℹ️  Aucune photo d\'objet à migrer');
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  let notFound = 0;

  for (const photo of photos) {
    if (!photo.url) continue;

    // Si déjà sur Supabase, ignorer
    if (photo.url.includes('supabase.co/storage')) {
      skipped++;
      continue;
    }

    console.log(`\n🔄 Migration photo ${photo.id}...`);

    console.log(`   URL actuelle: ${photo.url}`);

    // Télécharger l'image
    const buffer = await downloadImage(photo.url);
    if (!buffer) {
      console.warn(`⚠️  Impossible de télécharger la photo ${photo.id} (fichier non trouvé)`);
      notFound++;
      continue;
    }

    // Déterminer le bucket
    const imageType = detectImageType(photo.url);
    const bucket = IMAGE_TYPE_TO_BUCKET[imageType] || 'objects';

    // Générer un nom de fichier unique
    const originalName = extractFileName(photo.url);
    const fileName = generateUniqueFileName(originalName);

    // Upload vers Supabase
    const newUrl = await uploadToSupabase(buffer, fileName, bucket);
    if (!newUrl) {
      errors++;
      continue;
    }

    // Mettre à jour la base de données
    const { error: updateError } = await supabase
      .from('object_photos')
      .update({ url: newUrl })
      .eq('id', photo.id);

    if (updateError) {
      console.error(`❌ Erreur mise à jour photo ${photo.id}:`, updateError);
      errors++;
    } else {
      console.log(`✅ Photo ${photo.id} migrée: ${newUrl}`);
      migrated++;
    }
  }

  console.log(`\n📊 Résultat objects: ${migrated} migrés, ${skipped} ignorés, ${notFound} fichiers introuvables, ${errors} erreurs`);
}

/**
 * Migre les images des messages (message_images)
 */
async function migrateMessagesImages() {
  console.log('\n📸 Migration des images des messages...');
  
  const { data: images, error } = await supabase
    .from('message_images')
    .select('id, message_id, url');

  if (error) {
    console.error('❌ Erreur lors de la récupération des images de messages:', error);
    return;
  }

  if (!images || images.length === 0) {
    console.log('ℹ️  Aucune image de message à migrer');
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  let notFound = 0;

  for (const image of images) {
    if (!image.url) continue;

    // Si déjà sur Supabase, ignorer
    if (image.url.includes('supabase.co/storage')) {
      skipped++;
      continue;
    }

    console.log(`\n🔄 Migration image ${image.id}...`);

    console.log(`   URL actuelle: ${image.url}`);

    // Télécharger l'image
    const buffer = await downloadImage(image.url);
    if (!buffer) {
      console.warn(`⚠️  Impossible de télécharger l'image ${image.id} (fichier non trouvé)`);
      notFound++;
      continue;
    }

    // Déterminer le bucket
    const imageType = detectImageType(image.url);
    const bucket = IMAGE_TYPE_TO_BUCKET[imageType] || 'messages';

    // Générer un nom de fichier unique
    const originalName = extractFileName(image.url);
    const fileName = generateUniqueFileName(originalName);

    // Upload vers Supabase
    const newUrl = await uploadToSupabase(buffer, fileName, bucket);
    if (!newUrl) {
      errors++;
      continue;
    }

    // Mettre à jour la base de données
    const { error: updateError } = await supabase
      .from('message_images')
      .update({ url: newUrl })
      .eq('id', image.id);

    if (updateError) {
      console.error(`❌ Erreur mise à jour image ${image.id}:`, updateError);
      errors++;
    } else {
      console.log(`✅ Image ${image.id} migrée: ${newUrl}`);
      migrated++;
    }
  }

  console.log(`\n📊 Résultat messages: ${migrated} migrés, ${skipped} ignorés, ${notFound} fichiers introuvables, ${errors} erreurs`);
}

/**
 * Migre les images de la généalogie (persons)
 */
async function migrateGenealogyImages() {
  console.log('\n📸 Migration des images de généalogie...');
  
  const { data: persons, error } = await supabase
    .from('persons')
    .select('id, nom, prenom, image')
    .not('image', 'is', null);

  if (error) {
    console.error('❌ Erreur lors de la récupération des personnes:', error);
    return;
  }

  if (!persons || persons.length === 0) {
    console.log('ℹ️  Aucune image de généalogie à migrer');
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  let notFound = 0;

  for (const person of persons) {
    if (!person.image) continue;

    // Si déjà sur Supabase, ignorer
    if (person.image.includes('supabase.co/storage')) {
      console.log(`⏭️  ${person.prenom} ${person.nom}: Image déjà sur Supabase`);
      skipped++;
      continue;
    }

    console.log(`\n🔄 Migration de ${person.prenom} ${person.nom}...`);

    console.log(`   URL actuelle: ${person.image}`);

    // Télécharger l'image
    const buffer = await downloadImage(person.image);
    if (!buffer) {
      console.warn(`⚠️  Impossible de télécharger l'image de ${person.prenom} ${person.nom} (fichier non trouvé)`);
      notFound++;
      continue;
    }

    // Déterminer le bucket
    const imageType = detectImageType(person.image);
    const bucket = IMAGE_TYPE_TO_BUCKET[imageType] || 'genealogy';

    // Générer un nom de fichier unique
    const originalName = extractFileName(person.image);
    const fileName = generateUniqueFileName(originalName);

    // Upload vers Supabase
    const newUrl = await uploadToSupabase(buffer, fileName, bucket);
    if (!newUrl) {
      errors++;
      continue;
    }

    // Mettre à jour la base de données
    const { error: updateError } = await supabase
      .from('persons')
      .update({ image: newUrl })
      .eq('id', person.id);

    if (updateError) {
      console.error(`❌ Erreur mise à jour ${person.prenom} ${person.nom}:`, updateError);
      errors++;
    } else {
      console.log(`✅ ${person.prenom} ${person.nom} migré: ${newUrl}`);
      migrated++;
    }
  }

  console.log(`\n📊 Résultat genealogy: ${migrated} migrés, ${skipped} ignorés, ${notFound} fichiers introuvables, ${errors} erreurs`);
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Début de la migration des images vers Supabase Storage\n');
  console.log('📍 Configuration:');
  console.log(`   - Supabase URL: ${SUPABASE_URL}`);
  console.log(`   - Buckets: ${Object.values(IMAGE_TYPE_TO_BUCKET).join(', ')}\n`);

  try {
    await migrateUsersImages();
    await migrateObjectsImages();
    await migrateMessagesImages();
    await migrateGenealogyImages();

    console.log('\n✅ Migration terminée!');
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();


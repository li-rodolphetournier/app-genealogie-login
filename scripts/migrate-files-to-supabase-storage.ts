/**
 * Script de migration des fichiers locaux vers Supabase Storage
 * 
 * Ce script :
 * 1. Lit tous les fichiers depuis public/uploads/
 * 2. Upload chaque fichier vers Supabase Storage
 * 3. Met à jour les références dans les données JSON (optionnel)
 * 
 * Usage: npm run migrate:storage
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
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

/**
 * Mapping des dossiers locaux vers les buckets Supabase
 */
const FOLDER_TO_BUCKET: Record<string, string> = {
  messages: 'messages',
  objects: 'objects',
  users: 'users',
  genealogy: 'genealogy',
  login: 'uploads',
};

/**
 * Créer un bucket s'il n'existe pas
 */
async function ensureBucketExists(bucketName: string, isPublic = true): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  
  const bucketExists = buckets?.some((b) => b.name === bucketName);
  
  if (!bucketExists) {
    console.log(`   📦 Création du bucket "${bucketName}"...`);
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: isPublic,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    });
    
    if (error) {
      console.error(`   ❌ Erreur lors de la création du bucket "${bucketName}":`, error.message);
    } else {
      console.log(`   ✅ Bucket "${bucketName}" créé`);
    }
  }
}

/**
 * Upload un fichier vers Supabase Storage
 */
async function uploadFileToStorage(
  localPath: string,
  bucketName: string,
  filePath: string
): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);
  const fileName = path.basename(filePath);
  const folder = path.dirname(filePath);

  const uploadPath = folder !== '.' ? `${folder}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(uploadPath, fileBuffer, {
      contentType: getMimeType(fileName),
      upsert: false,
      cacheControl: '3600',
    });

  if (error) {
    throw new Error(error.message);
  }

  // Obtenir l'URL publique
  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
  return urlData.publicUrl;
}

/**
 * Obtenir le type MIME d'un fichier
 */
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Parcourir récursivement un dossier et uploader tous les fichiers
 */
async function migrateFolder(
  folderPath: string,
  relativePath: string = ''
): Promise<{ success: number; errors: number; files: Array<{ local: string; url: string }> }> {
  const results = {
    success: 0,
    errors: 0,
    files: [] as Array<{ local: string; url: string }>,
  };

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    const relativeFilePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      // Récursion pour les sous-dossiers
      const subResults = await migrateFolder(fullPath, relativeFilePath);
      results.success += subResults.success;
      results.errors += subResults.errors;
      results.files.push(...subResults.files);
    } else if (entry.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(entry.name)) {
      // Uploader seulement les images
      try {
        // Déterminer le bucket selon le dossier parent
        const folderName = relativePath.split('/')[0] || '';
        const bucketName = FOLDER_TO_BUCKET[folderName] || 'uploads';

        // S'assurer que le bucket existe
        await ensureBucketExists(bucketName);

        // Uploader le fichier
        const publicUrl = await uploadFileToStorage(
          fullPath,
          bucketName,
          relativeFilePath
        );

        results.success++;
        results.files.push({
          local: `/uploads/${relativeFilePath}`,
          url: publicUrl,
        });

        console.log(`   ✅ ${relativeFilePath} → ${bucketName}/${relativeFilePath}`);
      } catch (error: any) {
        results.errors++;
        console.error(`   ❌ Erreur pour ${relativeFilePath}:`, error.message);
      }
    }
  }

  return results;
}

/**
 * Fonction principale
 */
async function migrateFiles() {
  console.log('🚀 Démarrage de la migration vers Supabase Storage...\n');

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    console.log('⚠️  Le dossier public/uploads n\'existe pas. Aucun fichier à migrer.');
    return;
  }

  console.log(`📁 Dossier source : ${uploadsDir}\n`);

  // Créer tous les buckets nécessaires
  console.log('📦 Création des buckets Supabase...');
  for (const bucketName of Object.values(FOLDER_TO_BUCKET)) {
    await ensureBucketExists(bucketName);
  }
  console.log('');

  // Migrer tous les fichiers
  console.log('📤 Upload des fichiers...\n');
  const results = await migrateFolder(uploadsDir);

  // Résumé
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Résumé de la migration :');
  console.log(`   ✅ Succès : ${results.success}`);
  console.log(`   ❌ Erreurs : ${results.errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (results.files.length > 0) {
    console.log('📝 Fichiers migrés :\n');
    results.files.forEach((file) => {
      console.log(`   ${file.local} → ${file.url}`);
    });
    console.log('');
  }

  if (results.errors === 0) {
    console.log('🎉 Migration terminée avec succès !');
    console.log('\n⚠️  IMPORTANT :');
    console.log('   Vous devez maintenant mettre à jour les références de fichiers dans vos données JSON.');
    console.log('   Utilisez le mapping ci-dessus pour remplacer les anciens chemins par les nouvelles URLs Supabase.');
  } else {
    console.log('⚠️  Migration terminée avec des erreurs. Vérifiez les logs ci-dessus.');
  }
}

// Exécuter la migration
migrateFiles()
  .then(() => {
    console.log('\n✨ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale :', error);
    process.exit(1);
  });


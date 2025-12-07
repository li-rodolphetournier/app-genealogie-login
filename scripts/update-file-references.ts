/**
 * Script pour mettre à jour les références de fichiers dans les données JSON
 * Remplace les anciens chemins locaux par les URLs Supabase Storage
 * 
 * Usage: npm run update:file-refs
 */

import fs from 'fs';
import path from 'path';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ Erreur : NEXT_PUBLIC_SUPABASE_URL manquante');
  process.exit(1);
}

/**
 * Convertir un chemin local en URL Supabase Storage
 */
function convertPathToSupabaseUrl(localPath: string, supabaseUrl: string): string {
  // Format local : /uploads/folder/file.jpg
  // Format Supabase : https://xxxxx.supabase.co/storage/v1/object/public/bucket/folder/file.jpg
  
  if (!localPath || !localPath.startsWith('/uploads/')) {
    return localPath; // Garder tel quel si ce n'est pas un chemin local
  }

  // Extraire le dossier et le fichier
  const pathParts = localPath.replace('/uploads/', '').split('/');
  const folder = pathParts[0] || '';
  const fileName = pathParts.slice(1).join('/');

  // Mapping des dossiers vers les buckets
  const folderToBucket: Record<string, string> = {
    messages: 'messages',
    objects: 'objects',
    users: 'users',
    genealogy: 'genealogy',
    login: 'uploads',
  };

  const bucket = folderToBucket[folder] || 'uploads';
  const filePath = fileName || pathParts.join('/');

  // Construire l'URL Supabase
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
}

/**
 * Mettre à jour les références dans un objet JSON récursivement
 */
function updateReferencesInObject(obj: any, supabaseUrl: string, updated: { count: number }): any {
  if (Array.isArray(obj)) {
    return obj.map(item => updateReferencesInObject(item, supabaseUrl, updated));
  }

  if (obj && typeof obj === 'object') {
    const updated: { count: number } = { count: 0 };
    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Vérifier si c'est une URL de fichier à mettre à jour
      if (
        (key === 'url' || key === 'imageUrl' || key === 'profileImage' || key === 'image') &&
        typeof value === 'string' &&
        value.startsWith('/uploads/')
      ) {
        result[key] = convertPathToSupabaseUrl(value, supabaseUrl);
        updated.count++;
        console.log(`   ✓ ${key}: ${value} → ${result[key]}`);
      } else if (
        key === 'photos' &&
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === 'object' &&
        value[0].url
      ) {
        // Cas spécial pour les photos d'objets
        result[key] = value.map((photo: any) => {
          if (photo.url && photo.url.startsWith('/uploads/')) {
            updated.count++;
            console.log(`   ✓ photo.url: ${photo.url} → ${convertPathToSupabaseUrl(photo.url, supabaseUrl)}`);
            return { ...photo, url: convertPathToSupabaseUrl(photo.url, supabaseUrl) };
          }
          return photo;
        });
      } else if (
        key === 'images' &&
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === 'string' &&
        value[0].startsWith('/uploads/')
      ) {
        // Cas spécial pour les images (array de strings)
        result[key] = value.map((img: string) => {
          if (img.startsWith('/uploads/')) {
            updated.count++;
            console.log(`   ✓ images[]: ${img} → ${convertPathToSupabaseUrl(img, supabaseUrl)}`);
            return convertPathToSupabaseUrl(img, supabaseUrl);
          }
          return img;
        });
      } else {
        result[key] = updateReferencesInObject(value, supabaseUrl, updated);
      }
    }

    return result;
  }

  return obj;
}

/**
 * Mettre à jour un fichier JSON
 */
async function updateFileReferences(filePath: string, supabaseUrl: string): Promise<number> {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé : ${filePath}`);
    return 0;
  }

  console.log(`\n📝 Mise à jour de ${filePath}...`);
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const data = JSON.parse(content);
  
  const updated: { count: number } = { count: 0 };
  const updatedData = updateReferencesInObject(data, supabaseUrl, updated);

  if (updated.count > 0) {
    // Sauvegarder le fichier original (backup)
    const backupPath = `${fullPath}.backup`;
    fs.writeFileSync(backupPath, content, 'utf-8');
    console.log(`   💾 Backup créé : ${backupPath}`);

    // Écrire le fichier mis à jour
    fs.writeFileSync(fullPath, JSON.stringify(updatedData, null, 2), 'utf-8');
    console.log(`   ✅ ${updated.count} référence(s) mise(s) à jour`);
    return updated.count;
  } else {
    console.log(`   ⏭️  Aucune référence à mettre à jour`);
    return 0;
  }
}

/**
 * Fonction principale
 */
async function updateAllReferences() {
  console.log('🚀 Démarrage de la mise à jour des références de fichiers...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.error('❌ Erreur : NEXT_PUBLIC_SUPABASE_URL non définie');
    console.error('Assurez-vous que .env.local contient cette variable');
    process.exit(1);
  }

  console.log(`📍 URL Supabase : ${supabaseUrl}\n`);

  // Fichiers à mettre à jour
  const filesToUpdate = [
    'src/data/objects.json',
    'src/data/messages.json',
    'src/data/users.json',
    'src/data/genealogie.json',
  ];

  let totalUpdated = 0;

  for (const file of filesToUpdate) {
    const count = await updateFileReferences(file, supabaseUrl);
    totalUpdated += count;
  }

  // Résumé
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Résumé de la mise à jour :');
  console.log(`   ✅ Références mises à jour : ${totalUpdated}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (totalUpdated > 0) {
    console.log('✅ Mise à jour terminée avec succès !');
    console.log('\n⚠️  IMPORTANT :');
    console.log('   - Des fichiers .backup ont été créés pour chaque fichier modifié');
    console.log('   - Vérifiez que les URLs Supabase sont correctes');
    console.log('   - Testez l\'application pour vérifier que les images s\'affichent correctement');
  } else {
    console.log('ℹ️  Aucune référence locale trouvée. Les fichiers utilisent peut-être déjà Supabase Storage.');
  }
}

// Exécuter la mise à jour
updateAllReferences()
  .then(() => {
    console.log('\n✨ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale :', error);
    process.exit(1);
  });


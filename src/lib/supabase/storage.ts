/**
 * Utilitaires pour Supabase Storage
 * Gestion de l'upload et de la récupération de fichiers
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Récupère le client Supabase avec service role key
 * Création paresseuse pour éviter les erreurs lors du build si les variables d'environnement ne sont pas définies
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Variables d\'environnement Supabase manquantes. Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Variable pour stocker le client (création paresseuse)
let supabaseClient: ReturnType<typeof getSupabaseClient> | null = null;

/**
 * Récupère ou crée le client Supabase
 */
function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = getSupabaseClient();
  }
  return supabaseClient;
}

/**
 * Types de buckets disponibles
 */
export const STORAGE_BUCKETS = {
  MESSAGES: 'messages',
  OBJECTS: 'objects',
  USERS: 'users',
  GENEALOGY: 'genealogy',
  UPLOADS: 'uploads', // Bucket général pour les uploads divers
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

/**
 * Options pour l'upload de fichiers
 */
export type UploadOptions = {
  folder?: string;
  public?: boolean;
  upsert?: boolean;
};

/**
 * Résultat d'un upload
 */
export type UploadResult = {
  path: string;
  url: string;
  publicUrl: string;
};

/**
 * Upload un fichier vers Supabase Storage
 */
export async function uploadFile(
  bucket: StorageBucket,
  file: File | Buffer,
  fileName: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = '', public: isPublic = true, upsert = false } = options;

  // Créer le chemin complet
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  // Convertir File en Buffer si nécessaire
  let buffer: Buffer;
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    buffer = file;
  }

  // Upload vers Supabase Storage
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file instanceof File ? file.type : 'application/octet-stream',
      upsert,
      cacheControl: '3600',
    });

  if (error) {
    throw new Error(`Erreur lors de l'upload: ${error.message}`);
  }

  // Obtenir l'URL publique
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return {
    path: data.path,
    url: urlData.publicUrl,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Supprimer un fichier de Supabase Storage
 */
export async function deleteFile(
  bucket: StorageBucket,
  filePath: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    throw new Error(`Erreur lors de la suppression: ${error.message}`);
  }
}

/**
 * Obtenir l'URL publique d'un fichier
 */
export function getPublicUrl(bucket: StorageBucket, filePath: string): string {
  const supabase = getSupabase();
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Vérifier si un bucket existe, sinon le créer
 */
export async function ensureBucketExists(bucket: StorageBucket, isPublic = true): Promise<void> {
  const supabase = getSupabase();
  // Vérifier si le bucket existe
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Erreur lors de la vérification des buckets: ${listError.message}`);
  }

  const bucketExists = buckets?.some((b) => b.name === bucket);

  if (!bucketExists) {
    // Créer le bucket
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: isPublic,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    });

    if (createError) {
      throw new Error(`Erreur lors de la création du bucket: ${createError.message}`);
    }
  }
}

/**
 * Migrer un fichier du système de fichiers local vers Supabase Storage
 */
export async function migrateLocalFileToStorage(
  localPath: string,
  bucket: StorageBucket,
  targetPath: string
): Promise<UploadResult> {
  const fs = await import('fs/promises');
  const path = await import('path');

  // Lire le fichier local
  const fileBuffer = await fs.readFile(localPath);

  // Upload vers Supabase Storage
  const fileName = path.basename(targetPath);
  const folder = path.dirname(targetPath);

  return uploadFile(
    bucket,
    fileBuffer,
    fileName,
    {
      folder: folder !== '.' ? folder : undefined,
      public: true,
      upsert: false,
    }
  );
}


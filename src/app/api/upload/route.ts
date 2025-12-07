/**
 * Route API pour l'upload de fichiers vers Supabase Storage
 * Remplace l'ancien système de stockage local
 */

import { NextResponse } from 'next/server';
import { uploadFile, STORAGE_BUCKETS, ensureBucketExists, type StorageBucket } from '@/lib/supabase/storage';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/errors/error-handler';
import { getErrorMessage } from '@/lib/errors/messages';
import type { ErrorResponse } from '@/types/api/requests';

// Définir la taille maximale (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB en bytes

// Mapping des dossiers vers les buckets Supabase
const FOLDER_TO_BUCKET: Record<string, StorageBucket> = {
  messages: STORAGE_BUCKETS.MESSAGES,
  objects: STORAGE_BUCKETS.OBJECTS,
  users: STORAGE_BUCKETS.USERS,
  genealogy: STORAGE_BUCKETS.GENEALOGY,
  login: STORAGE_BUCKETS.UPLOADS,
  '': STORAGE_BUCKETS.UPLOADS,
};

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || '';

    if (!file) {
      return NextResponse.json<ErrorResponse>(
        { error: "Aucun fichier n'a été envoyé" },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Le fichier est trop volumineux. La taille maximale est de 10MB.',
        },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Seules les images sont autorisées.' },
        { status: 400 }
      );
    }

    // Déterminer le bucket à utiliser
    const bucket = FOLDER_TO_BUCKET[folder] || STORAGE_BUCKETS.UPLOADS;

    // S'assurer que le bucket existe
    try {
      await ensureBucketExists(bucket, true);
    } catch (error) {
      logError(error, 'API Upload - Ensure Bucket');
      // Continuer même si le bucket existe déjà (erreur normale)
    }

    // Créer un nom de fichier unique
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
    const fileName = `${uniqueSuffix}-${originalName}`;

    // Upload vers Supabase Storage
    const uploadResult = await uploadFile(
      bucket,
      file,
      fileName,
      {
        folder: folder || undefined,
        public: true,
        upsert: false,
      }
    );

    return NextResponse.json({
      message: 'Fichier uploadé avec succès',
      fileName: fileName,
      imageUrl: uploadResult.publicUrl,
      filePath: uploadResult.path,
    });
  } catch (error) {
    logError(error, 'API Upload');
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : getErrorMessage('FILE_UPLOAD_FAILED') },
      { status: 500 }
    );
  }
}

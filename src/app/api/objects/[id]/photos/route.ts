import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { ObjectData, ObjectPhoto } from '@/types/objects';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

const objectsPath = path.join(process.cwd(), 'src/data/objects.json');

async function readObjects(): Promise<ObjectData[]> {
  try {
    const data = await fs.readFile(objectsPath, 'utf-8');
    return JSON.parse(data) as ObjectData[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeObjects(objects: ObjectData[]): Promise<void> {
  await fs.writeFile(objectsPath, JSON.stringify(objects, null, 2), 'utf-8');
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST - Ajouter des photos à un objet
export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body: { photos: ObjectPhoto[] } = await request.json();
    const { photos } = body;

    if (!photos || !Array.isArray(photos)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Photos manquantes ou format invalide' },
        { status: 400 }
      );
    }

    const objects = await readObjects();
    const objectIndex = objects.findIndex(obj => obj.id === id);

    if (objectIndex === -1) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Objet non trouvé' },
        { status: 404 }
      );
    }

    // Ajouter les nouvelles photos
    const currentPhotos = objects[objectIndex].photos || [];
    const updatedPhotos = [...currentPhotos, ...photos];

    objects[objectIndex].photos = updatedPhotos;
    objects[objectIndex].updatedAt = new Date().toISOString();

    await writeObjects(objects);

    return NextResponse.json<SuccessResponse<{ photos: ObjectPhoto[] }>>(
      { message: 'Photos ajoutées avec succès', data: { photos } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de l\'ajout des photos:', error);
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout des photos' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une photo d'un objet
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const photoIndex = searchParams.get('photoIndex');

    if (!photoIndex) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Index de photo manquant' },
        { status: 400 }
      );
    }

    const photoIdx = parseInt(photoIndex);
    if (isNaN(photoIdx) || photoIdx < 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Index de photo invalide' },
        { status: 400 }
      );
    }

    const objects = await readObjects();
    const objectIndex = objects.findIndex(obj => obj.id === id);

    if (objectIndex === -1) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Objet non trouvé' },
        { status: 404 }
      );
    }

    const photos = objects[objectIndex].photos || [];
    if (photoIdx >= photos.length) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Index de photo invalide' },
        { status: 400 }
      );
    }

    // Supprimer le fichier physique si nécessaire
    const photoUrl = photos[photoIdx].url;
    if (photoUrl) {
      const filePath = path.join(process.cwd(), 'public', photoUrl);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Erreur lors de la suppression du fichier:', error);
        // Continuer même si la suppression du fichier échoue
      }
    }

    // Supprimer la photo du tableau
    photos.splice(photoIdx, 1);
    objects[objectIndex].photos = photos;
    objects[objectIndex].updatedAt = new Date().toISOString();

    await writeObjects(objects);

    return NextResponse.json<SuccessResponse>(
      { message: 'Photo supprimée avec succès' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la photo:', error);
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la photo' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { objectCreateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { getErrorMessage } from '@/lib/errors/messages';
import type { ObjectData } from '@/types/objects';
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
    console.error('Erreur lecture objects.json:', error);
    throw new Error('Impossible de lire les données des objets.');
  }
}

async function writeObjects(objects: ObjectData[]): Promise<void> {
  try {
    await fs.writeFile(objectsPath, JSON.stringify(objects, null, 2), 'utf-8');
  } catch (error) {
    console.error("Erreur d'écriture dans objects.json:", error);
    throw new Error("Impossible de sauvegarder les données des objets.");
  }
}

// GET - Récupérer tous les objets
export async function GET() {
  try {
    const objects = await readObjects();
    return NextResponse.json<ObjectData[]>(objects, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des objets:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel objet
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation Zod
    const validation = validateWithSchema(objectCreateSchema, body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }
    
    const { nom, type, status, utilisateur, description, longDescription, photos } = validation.data;

    const objects = await readObjects();

    // Créer le nouvel objet
    const newObject: ObjectData = {
      id: Date.now().toString(),
      nom,
      type,
      status,
      utilisateur,
      description,
      longDescription,
      photos: photos || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    objects.push(newObject);
    await writeObjects(objects);

    // Revalider le cache
    revalidatePath('/objects', 'page');
    revalidatePath(`/objects/${newObject.id}`, 'page');

    return NextResponse.json<SuccessResponse<ObjectData>>(
      { message: 'Objet créé avec succès', data: newObject },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'objet:', error);
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : getErrorMessage('OBJECT_CREATE_FAILED') },
      { status: 500 }
    );
  }
}


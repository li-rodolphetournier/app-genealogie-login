import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { objectUpdateSchema } from '@/lib/validations';
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
    throw error;
  }
}

async function writeObjects(objects: ObjectData[]): Promise<void> {
  await fs.writeFile(objectsPath, JSON.stringify(objects, null, 2), 'utf-8');
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Récupérer un objet par ID
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const objects = await readObjects();
    const object = objects.find(obj => obj.id === id);

    if (!object) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('OBJECT_NOT_FOUND') },
        { status: 404 }
      );
    }

    return NextResponse.json<ObjectData>(object, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'objet:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un objet
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    // Validation Zod
    const validation = validateWithSchema(objectUpdateSchema, body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }
    
    const objects = await readObjects();
    const objectIndex = objects.findIndex(obj => obj.id === id);

    if (objectIndex === -1) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('OBJECT_NOT_FOUND') },
        { status: 404 }
      );
    }

    // Mettre à jour l'objet
    const updatedObject: ObjectData = {
      ...objects[objectIndex],
      ...validation.data,
      id, // Garantir que l'ID ne change pas
      updatedAt: new Date().toISOString(),
    };

    objects[objectIndex] = updatedObject;
    await writeObjects(objects);

    // Revalider le cache
    revalidatePath('/objects', 'page');
    revalidatePath(`/objects/${id}`, 'page');

    return NextResponse.json<SuccessResponse<ObjectData>>(
      { message: 'Objet mis à jour avec succès', data: updatedObject },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'objet:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un objet
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const objects = await readObjects();
    const filteredObjects = objects.filter(obj => obj.id !== id);

    if (objects.length === filteredObjects.length) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('OBJECT_NOT_FOUND') },
        { status: 404 }
      );
    }

    await writeObjects(filteredObjects);

    // Revalider le cache
    revalidatePath('/objects', 'page');
    revalidatePath(`/objects/${id}`, 'page');

    return NextResponse.json<SuccessResponse>(
      { message: 'Objet supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'objet:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}


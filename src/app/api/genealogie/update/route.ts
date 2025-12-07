import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { personUpdateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { getErrorMessage } from '@/lib/errors/messages';
import type { Person } from '@/types/genealogy';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

const genealogiePath = path.join(process.cwd(), 'src/data/genealogie.json');

async function readPersons(): Promise<Person[]> {
  try {
    const data = await fs.readFile(genealogiePath, 'utf-8');
    return JSON.parse(data) as Person[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writePersons(persons: Person[]): Promise<void> {
  await fs.writeFile(genealogiePath, JSON.stringify(persons, null, 2), 'utf-8');
}

// PUT - Mettre à jour une personne
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json<ErrorResponse>(
        { error: 'ID de la personne manquant' },
        { status: 400 }
      );
    }

    // Validation Zod pour les données de mise à jour
    const validation = validateWithSchema(personUpdateSchema, updateData);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }

    const persons = await readPersons();
    const personIndex = persons.findIndex(p => p.id === id);

    if (personIndex === -1) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Personne non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la personne
    const updatedPerson: Person = {
      ...persons[personIndex],
      ...validation.data,
      id, // Garantir que l'ID ne change pas
    };

    persons[personIndex] = updatedPerson;
    await writePersons(persons);

    // Revalider le cache
    revalidatePath('/genealogie', 'page');

    return NextResponse.json<SuccessResponse<Person>>(
      { message: 'Personne mise à jour avec succès', data: updatedPerson },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la personne:', error);
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : getErrorMessage('GENEALOGY_PERSON_UPDATE_FAILED') },
      { status: 500 }
    );
  }
}


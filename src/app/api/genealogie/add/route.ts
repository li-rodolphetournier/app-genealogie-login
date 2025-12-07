import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { personCreateSchema } from '@/lib/validations';
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

// POST - Ajouter une nouvelle personne
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation Zod
    const validation = validateWithSchema(personCreateSchema, body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }
    
    const { nom, prenom, genre, description, mere, pere, ordreNaissance, dateNaissance, dateDeces, image } = validation.data;

    const persons = await readPersons();

    // Générer un ID unique
    const id = Date.now().toString();
    
    // Vérifier si la personne existe déjà (par nom/prénom/date)
    const existingPerson = persons.find(
      p => p.nom === nom && p.prenom === prenom && p.dateNaissance === dateNaissance
    );
    if (existingPerson) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Une personne avec ces informations existe déjà' },
        { status: 409 }
      );
    }

    // Créer la nouvelle personne
    const newPerson: Person = {
      id,
      nom,
      prenom,
      genre,
      description: description || '',
      mere: mere || null,
      pere: pere || null,
      ordreNaissance: ordreNaissance || 1,
      dateNaissance,
      dateDeces: dateDeces || null,
      image: image || null,
    };

    persons.push(newPerson);
    await writePersons(persons);

    // Revalider le cache
    revalidatePath('/genealogie', 'page');

    return NextResponse.json<SuccessResponse<Person>>(
      { message: 'Personne ajoutée avec succès', data: newPerson },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur lors de l\'ajout de la personne:', error);
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : getErrorMessage('GENEALOGY_PERSON_ADD_FAILED') },
      { status: 500 }
    );
  }
}


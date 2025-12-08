import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { personCreateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { getErrorMessage } from '@/lib/errors/messages';
import type { Person } from '@/types/genealogy';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

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
    const supabase = await createServiceRoleClient();

    // Générer un ID unique
    const id = Date.now().toString();
    
    // Vérifier si la personne existe déjà (par nom/prénom/date)
    const { data: existingPerson } = await supabase
      .from('persons')
      .select('id')
      .eq('nom', nom)
      .eq('prenom', prenom)
      .eq('date_naissance', dateNaissance)
      .single();

    if (existingPerson) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Une personne avec ces informations existe déjà' },
        { status: 409 }
      );
    }

    // Créer la nouvelle personne
    const { data: newPerson, error: insertError } = await supabase
      .from('persons')
      .insert({
        id,
        nom,
        prenom,
        genre,
        description: description || '',
        detail: null,
        mere_id: mere || null,
        pere_id: pere || null,
        ordre_naissance: ordreNaissance || 1,
        date_naissance: dateNaissance || null,
        date_deces: dateDeces || null,
        image: image || null,
      })
      .select()
      .single();

    if (insertError || !newPerson) {
      console.error('Erreur création personne:', insertError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la création de la personne' },
        { status: 500 }
      );
    }

    // Mapper vers Person
    const personData: Person = {
      id: newPerson.id,
      nom: newPerson.nom,
      prenom: newPerson.prenom,
      genre: newPerson.genre as Person['genre'],
      description: newPerson.description || '',
      mere: newPerson.mere_id || null,
      pere: newPerson.pere_id || null,
      ordreNaissance: newPerson.ordre_naissance || 1,
      dateNaissance: newPerson.date_naissance || '',
      dateDeces: newPerson.date_deces || null,
      image: newPerson.image || null,
    };

    // Revalider le cache
    revalidatePath('/genealogie', 'page');

    return NextResponse.json<SuccessResponse<Person>>(
      { message: 'Personne ajoutée avec succès', data: personData },
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

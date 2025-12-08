import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { personUpdateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { getErrorMessage } from '@/lib/errors/messages';
import type { Person } from '@/types/genealogy';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

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

    const supabase = await createServiceRoleClient();

    // Vérifier que la personne existe
    const { data: existingPerson } = await supabase
      .from('persons')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingPerson) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Personne non trouvée' },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateFields: Record<string, any> = {};
    
    if (validation.data.nom !== undefined) updateFields.nom = validation.data.nom;
    if (validation.data.prenom !== undefined) updateFields.prenom = validation.data.prenom;
    if (validation.data.genre !== undefined) updateFields.genre = validation.data.genre;
    if (validation.data.description !== undefined) updateFields.description = validation.data.description || '';
    if (validation.data.mere !== undefined) updateFields.mere_id = validation.data.mere || null;
    if (validation.data.pere !== undefined) updateFields.pere_id = validation.data.pere || null;
    if (validation.data.ordreNaissance !== undefined) updateFields.ordre_naissance = validation.data.ordreNaissance;
    if (validation.data.dateNaissance !== undefined) updateFields.date_naissance = validation.data.dateNaissance || null;
    if (validation.data.dateDeces !== undefined) updateFields.date_deces = validation.data.dateDeces || null;
    if (validation.data.image !== undefined) updateFields.image = validation.data.image || null;

    // Mettre à jour la personne
    const { data: updatedPerson, error: updateError } = await supabase
      .from('persons')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedPerson) {
      console.error('Erreur mise à jour personne:', updateError);
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('GENEALOGY_PERSON_UPDATE_FAILED') },
        { status: 500 }
      );
    }

    // Mapper vers Person
    const personData: Person = {
      id: updatedPerson.id,
      nom: updatedPerson.nom,
      prenom: updatedPerson.prenom,
      genre: updatedPerson.genre as Person['genre'],
      description: updatedPerson.description || '',
      mere: updatedPerson.mere_id || null,
      pere: updatedPerson.pere_id || null,
      ordreNaissance: updatedPerson.ordre_naissance || 1,
      dateNaissance: updatedPerson.date_naissance || '',
      dateDeces: updatedPerson.date_deces || null,
      image: updatedPerson.image || null,
    };

    // Revalider le cache
    revalidatePath('/genealogie', 'page');

    return NextResponse.json<SuccessResponse<Person>>(
      { message: 'Personne mise à jour avec succès', data: personData },
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

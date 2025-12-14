import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireRedactor } from '@/lib/auth/middleware';
import { createErrorResponse } from '@/lib/api/error-handler';
import { determineUpdatedBy, logGenealogyHistory } from '@/lib/utils/history-helpers';
import { getErrorMessage } from '@/lib/errors/messages';
import { logger } from '@/lib/utils/logger';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

// DELETE - Supprimer une personne
export async function DELETE(request: Request) {
  try {
    // Vérifier les droits
    const user = await requireRedactor();

    // Vérifier que l'utilisateur a un ID valide
    if (!user || !user.id) {
      logger.error('[API /genealogie/delete] Utilisateur sans ID valide:', user);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur d\'authentification : utilisateur invalide' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json<ErrorResponse>(
        { error: 'ID de la personne manquant' },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    // Vérifier que la personne existe et récupérer ses informations
    const { data: existingPerson } = await supabase
      .from('persons')
      .select('id, prenom, nom')
      .eq('id', id)
      .single();

    if (!existingPerson) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Personne non trouvée' },
        { status: 404 }
      );
    }

    // Récupérer la position de la personne si elle existe
    const { data: position, error: positionError } = await supabase
      .from('genealogy_node_positions')
      .select('x, y')
      .eq('person_id', id)
      .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter une erreur si pas de position

    if (positionError && positionError.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('[API /genealogie/delete] Erreur lors de la récupération de la position:', positionError);
      // Continuer quand même, on utilisera des valeurs par défaut
    }

    // Enregistrer la suppression dans l'historique AVANT de supprimer la personne
    const updatedBy = await determineUpdatedBy(supabase, user.id);
    
    await logGenealogyHistory(supabase, {
      person_id: id,
      x: position?.x || 0,
      y: position?.y || 0,
      updated_at: new Date().toISOString(),
      action: 'deleted', // logGenealogyHistory gère le fallback person_deleted -> deleted
      updated_by: updatedBy,
    });

    // Supprimer d'abord les positions
    // Le trigger enregistrera automatiquement la suppression de la position dans l'historique
    const { error: deletePositionsError } = await supabase
      .from('genealogy_node_positions')
      .delete()
      .eq('person_id', id);

    if (deletePositionsError) {
      logger.error('[API /genealogie/delete] Erreur lors de la suppression des positions:', deletePositionsError);
      // Continuer quand même, ce n'est pas critique
    }

    // Supprimer la personne
    // Les contraintes ON DELETE SET NULL dans le schéma géreront automatiquement
    // la mise à jour des références père/mère des autres personnes
    // L'historique sera préservé grâce à ON DELETE SET NULL sur person_id
    const { error: deleteError } = await supabase
      .from('persons')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('[API /genealogie/delete] Erreur lors de la suppression:', deleteError);
      logger.error('[API /genealogie/delete] Détails de l\'erreur:', {
        code: deleteError.code,
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint
      });
      return createErrorResponse(
        deleteError,
        500,
        { route: '/api/genealogie/delete', operation: 'DELETE' }
      );
    }

    // Revalider le cache
    revalidatePath('/genealogie', 'page');

    return NextResponse.json<SuccessResponse>(
      { message: 'Personne supprimée avec succès' },
      { status: 200 }
    );
  } catch (error: unknown) {
    return createErrorResponse(
      error,
      500,
      { route: '/api/genealogie/delete', operation: 'DELETE' }
    );
  }
}


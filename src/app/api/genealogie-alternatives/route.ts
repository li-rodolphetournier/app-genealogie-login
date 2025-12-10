/**
 * API Route pour les alternatives de visualisation généalogique
 * Réutilise GenealogyService - même source de données que /api/genealogie
 */

import { NextResponse } from 'next/server';
import { GenealogyService } from '@/lib/services';
import type { Person } from '@/types/genealogy';
import type { ErrorResponse } from '@/types/api/responses';

/**
 * GET - Récupérer toutes les personnes pour les visualisations alternatives
 * Utilise la même source de données que /api/genealogie
 */
export async function GET() {
  try {
    const persons = await GenealogyService.findAll();
    return NextResponse.json<Person[]>(persons, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des données généalogiques (alternatives):', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la lecture des données généalogiques' },
      { status: 500 }
    );
  }
}


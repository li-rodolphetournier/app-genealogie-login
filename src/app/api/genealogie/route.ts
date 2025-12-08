import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Person } from '@/types/genealogy';
import type { ErrorResponse } from '@/types/api/responses';

// GET - Récupérer toutes les personnes de la généalogie
export async function GET() {
  try {
    const supabase = await createServiceRoleClient();

    const { data: persons, error } = await supabase
      .from('persons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur Supabase lors de la récupération des personnes:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la lecture des données généalogiques' },
        { status: 500 }
      );
    }

    // Mapper les données Supabase vers Person
    const mappedPersons: Person[] = (persons || []).map((p: any) => ({
      id: p.id,
      nom: p.nom,
      prenom: p.prenom,
      genre: p.genre as Person['genre'],
      description: p.description || '',
      detail: p.detail || undefined,
      mere: p.mere_id || null,
      pere: p.pere_id || null,
      ordreNaissance: p.ordre_naissance || 1,
      dateNaissance: p.date_naissance || undefined,
      dateDeces: p.date_deces || null,
      image: p.image || null,
    }));
    
    return NextResponse.json<Person[]>(mappedPersons, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la lecture des données généalogiques:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la lecture des données généalogiques' },
      { status: 500 }
    );
  }
}

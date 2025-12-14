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
    const mappedPersons: Person[] = (persons || []).map((p: unknown) => {
      const person = p as {
        id: string;
        prenom: string;
        nom: string;
        genre: string;
        description: string | null;
        date_naissance: string | null;
        date_deces: string | null;
        image: string | null;
        pere_id: string | null;
        mere_id: string | null;
        ordre_naissance: number | null;
      };
      return {
        id: person.id,
        nom: person.nom,
        prenom: person.prenom,
        genre: person.genre as Person['genre'],
        description: person.description || '',
        detail: person.description || undefined,
        mere: person.mere_id || null,
        pere: person.pere_id || null,
        ordreNaissance: person.ordre_naissance || 1,
        dateNaissance: person.date_naissance || '',
        dateDeces: person.date_deces || null,
        image: person.image || null,
      };
    });
    
    return NextResponse.json<Person[]>(mappedPersons, { status: 200 });
  } catch (error: unknown) {
    console.error('Erreur lors de la lecture des données généalogiques:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la lecture des données généalogiques' },
      { status: 500 }
    );
  }
}

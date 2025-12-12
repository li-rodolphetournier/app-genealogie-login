/**
 * API Route pour les statistiques des personnes créées
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { ErrorResponse } from '@/types/api/responses';
import { logger } from '@/lib/utils/logger';

type TimeFilter = '1day' | '15days' | '1month' | '1year' | 'all';

interface PersonStats {
  date: string;
  count: number;
  persons: Array<{
    id: string;
    nom: string;
    prenom: string;
    created_at: string;
    created_by: string | null;
    creator: {
      login: string;
      email: string;
    } | null;
  }>;
}

interface StatsResponse {
  stats: PersonStats[];
  total: number;
  period: string;
}

function getDateFilter(filter: TimeFilter): Date | null {
  const now = new Date();
  switch (filter) {
    case '1day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '15days':
      return new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    case '1month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '1year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
    default:
      return null;
  }
}

// GET - Récupérer les statistiques des personnes créées
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get('filter') || 'all') as TimeFilter;

    const supabase = await createServiceRoleClient();
    const dateFilter = getDateFilter(filter);

    // Construire la requête
    let query = supabase
      .from('persons')
      .select('id, nom, prenom, created_at, created_by')
      .order('created_at', { ascending: false });

    // Appliquer le filtre de date si nécessaire
    if (dateFilter) {
      query = query.gte('created_at', dateFilter.toISOString());
    }

    const { data: persons, error } = await query;

    if (error) {
      logger.error('[API /persons/stats] Erreur Supabase:', error);
      return NextResponse.json<ErrorResponse>(
        { error: `Erreur lors de la récupération des statistiques: ${error.message || 'Erreur inconnue'}` },
        { status: 500 }
      );
    }

    // Récupérer tous les IDs de créateurs uniques
    const creatorIds = [...new Set((persons || []).map((p: any) => p.created_by).filter(Boolean))];
    
    // Récupérer les informations des créateurs
    const creatorsMap = new Map<string, { login: string; email: string }>();
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('users')
        .select('id, login, email')
        .in('id', creatorIds);
      
      (creators || []).forEach((creator: any) => {
        creatorsMap.set(creator.id, {
          login: creator.login || 'Inconnu',
          email: creator.email || '',
        });
      });
    }

    // Grouper par date (jour)
    const statsByDate = new Map<string, PersonStats>();

    (persons || []).forEach((person: any) => {
      const date = new Date(person.created_at);
      const dateKey = date.toISOString().split('T')[0]; // Format YYYY-MM-DD

      if (!statsByDate.has(dateKey)) {
        statsByDate.set(dateKey, {
          date: dateKey,
          count: 0,
          persons: [],
        });
      }

      const stat = statsByDate.get(dateKey)!;
      stat.count += 1;
      
      // Récupérer les informations du créateur depuis la map
      const creator = person.created_by && creatorsMap.has(person.created_by)
        ? creatorsMap.get(person.created_by)!
        : null;

      stat.persons.push({
        id: person.id,
        nom: person.nom,
        prenom: person.prenom,
        created_at: person.created_at,
        created_by: person.created_by || null,
        creator: creator,
      });
    });

    // Convertir en tableau et trier par date (plus récent en premier)
    const stats = Array.from(statsByDate.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const total = persons?.length || 0;

    // Déterminer la période
    let period = 'Toutes les périodes';
    if (dateFilter) {
      const daysAgo = Math.floor((Date.now() - dateFilter.getTime()) / (24 * 60 * 60 * 1000));
      period = `Derniers ${daysAgo} jours`;
    }

    return NextResponse.json<StatsResponse>(
      { stats, total, period },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('[API /persons/stats] Erreur:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json<ErrorResponse>(
      { error: `Erreur lors de la récupération des statistiques: ${errorMessage}` },
      { status: 500 }
    );
  }
}


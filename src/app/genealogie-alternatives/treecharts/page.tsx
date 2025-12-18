/**
 * Page Server Component pour la généalogie avec TreeCharts
 * Récupère les données initiales côté serveur et les passe au composant client
 * 
 * ⚠️ À IMPLÉMENTER - Phase 3
 */

import { GenealogyService } from '@/lib/services';
import { GenealogieTreechartsClient } from './genealogie-treecharts-client';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Person } from '@/types/genealogy';

// Forcer le rendu dynamique car on utilise cookies() pour l'authentification
export const dynamic = 'force-dynamic';

export default async function GenealogieTreecharts() {
  // Récupération des données initiales côté serveur (même source que la version originale)
  let persons: Person[] = [];
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      persons = await GenealogyService.findAll();
    }
  } catch (error: any) {
    // Ignorer les erreurs pendant le build
    if (process.env.NODE_ENV === 'production' && error?.isBuildError) {
      // Pendant le build Vercel, c'est normal
    } else {
      console.error('Erreur lors de la récupération des données généalogiques (TreeCharts):', error);
    }
    // Continue avec un tableau vide en cas d'erreur
  }

  // Passer les données au composant client pour l'interactivité
  return <GenealogieTreechartsClient initialPersons={persons} />;
}


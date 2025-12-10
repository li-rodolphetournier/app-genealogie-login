/**
 * Page Server Component pour la généalogie avec Nivo
 * Récupère les données initiales côté serveur et les passe au composant client
 * 
 * ⚠️ À IMPLÉMENTER - Phase 2
 */

import { GenealogyService } from '@/lib/services';
import { GenealogieNivoClient } from './genealogie-nivo-client';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Person } from '@/types/genealogy';

// Forcer le rendu dynamique car on utilise cookies() pour l'authentification
export const dynamic = 'force-dynamic';

export default async function GenealogieNivo() {
  // Vérifier la visibilité de la carte
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Récupérer le statut de l'utilisateur
    const { data: profile } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single();

    // Si l'utilisateur n'est pas admin, vérifier la visibilité
    if (profile?.status !== 'administrateur') {
      const { data: visibility } = await supabase
        .from('genealogy_card_visibility')
        .select('is_visible')
        .eq('card_key', 'genealogie-nivo')
        .single();

      if (!visibility?.is_visible) {
        redirect('/accueil');
      }
    }
  }

  // Récupération des données initiales côté serveur (même source que la version originale)
  let persons: Person[] = [];
  try {
    persons = await GenealogyService.findAll();
  } catch (error) {
    console.error('Erreur lors de la récupération des données généalogiques (Nivo):', error);
    // Continue avec un tableau vide en cas d'erreur
  }

  // Passer les données au composant client pour l'interactivité
  return <GenealogieNivoClient initialPersons={persons} />;
}


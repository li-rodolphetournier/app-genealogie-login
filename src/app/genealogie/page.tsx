/**
 * Page Server Component pour la généalogie
 * Récupère les données initiales côté serveur et les passe au composant client
 */

import { GenealogyService } from '@/lib/services';
import { GenealogieClient } from './genealogie-client';

export default async function Genealogie() {
  // Récupération des données initiales côté serveur
  let persons = [];
  try {
    persons = await GenealogyService.findAll();
  } catch (error) {
    console.error('Erreur lors de la récupération des données généalogiques:', error);
    // Continue avec un tableau vide en cas d'erreur
  }

  // Passer les données au composant client pour l'interactivité
  return <GenealogieClient initialPersons={persons} />;
}

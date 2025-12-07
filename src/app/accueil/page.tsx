/**
 * Page Server Component pour l'accueil
 * Récupère le dernier message côté serveur et les passe au composant client
 */

import { MessageService } from '@/lib/services';
import { AccueilClient } from './accueil-client';

export default async function Accueil() {
  // Récupération du dernier message côté serveur
  let lastMessage = null;
  try {
    lastMessage = await MessageService.findLast();
  } catch (error) {
    console.error('Erreur lors de la récupération du dernier message:', error);
    // Continue même si le message n'a pas pu être chargé
  }

  // Passer les données au composant client pour l'authentification et l'interactivité
  return <AccueilClient initialLastMessage={lastMessage} />;
}

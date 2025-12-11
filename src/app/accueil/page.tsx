/**
 * Page Server Component pour l'accueil
 * Récupère le dernier message côté serveur et les passe au composant client
 */

import { MessageService } from '@/lib/services';
import { AccueilClient } from './accueil-client';

export const dynamic = 'force-dynamic';

export default async function Accueil() {
  // Récupération du dernier message côté serveur
  let lastMessage = null;
  try {
    // Vérifier si les variables d'environnement sont disponibles
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      lastMessage = await MessageService.findLast();
    }
  } catch (error: any) {
    // Ignorer silencieusement les erreurs pendant le build
    if (process.env.NODE_ENV === 'production' && error?.isBuildError) {
      // Pendant le build Vercel, les variables d'environnement ne sont pas toujours disponibles
      // C'est normal, elles seront disponibles au runtime
    } else {
      console.error('Erreur lors de la récupération du dernier message:', error);
    }
    // Continue même si le message n'a pas pu être chargé
  }

  // Passer les données au composant client pour l'authentification et l'interactivité
  return <AccueilClient initialLastMessage={lastMessage} />;
}

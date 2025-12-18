/**
 * Page Server Component pour l'accueil
 * Récupère tous les messages affichés sur l'accueil côté serveur et les passe au composant client
 * et vérifie l'authentification côté serveur.
 */

import { MessageService } from '@/lib/services';
import { AccueilClient } from './accueil-client';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Accueil() {
  // Protection serveur : utilisateur connecté requis
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/'); // page de login
    }
  } catch (error) {
    // Ne pas logger les redirections "normales" de Next (NEXT_REDIRECT)
    if (error instanceof Error && (error as any).digest?.startsWith?.('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Erreur lors de la vérification d’authentification pour /accueil:', error);
    redirect('/');
  }

  // Récupération de tous les messages affichés sur l'accueil côté serveur
  let displayedMessages: any[] = [];
  try {
    // Vérifier si les variables d'environnement sont disponibles
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      displayedMessages = await MessageService.findAllDisplayedOnHome();
    }
  } catch (error: any) {
    // Ignorer silencieusement les erreurs pendant le build
    if (process.env.NODE_ENV === 'production' && error?.isBuildError) {
      // Pendant le build Vercel, les variables d'environnement ne sont pas toujours disponibles
      // C'est normal, elles seront disponibles au runtime
    } else {
      console.error('Erreur lors de la récupération des messages:', error);
    }
    // Continue même si les messages n'ont pas pu être chargés
  }

  // Passer les données au composant client pour l'authentification et l'interactivité
  return <AccueilClient initialDisplayedMessages={displayedMessages} />;
}

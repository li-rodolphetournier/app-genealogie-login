/**
 * Page Server Component pour la liste des objets
 * Récupère les données côté serveur et les passe au composant client
 */

import { ObjectService } from '@/lib/services';
import { ObjectsClient } from './objects-client';

export const dynamic = 'force-dynamic';

export default async function ObjectsList() {
  // Récupération des données côté serveur
  let objects = [];
  try {
    // Vérifier si les variables d'environnement sont disponibles
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      objects = await ObjectService.findAll();
    }
  } catch (error: any) {
    // Ignorer silencieusement les erreurs pendant le build
    if (process.env.NODE_ENV === 'production' && error?.isBuildError) {
      // Pendant le build Vercel, les variables d'environnement ne sont pas toujours disponibles
      // C'est normal, elles seront disponibles au runtime
      objects = [];
    } else {
      console.error('Erreur lors de la récupération des objets:', error);
      return (
        <div role="alert" className="flex items-center justify-center h-screen text-red-600">
          Erreur lors du chargement des objets
        </div>
      );
    }
  }

  // Passer les données au composant client pour l'interactivité
  return <ObjectsClient initialObjects={objects} />;
}

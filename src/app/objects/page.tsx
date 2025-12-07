/**
 * Page Server Component pour la liste des objets
 * Récupère les données côté serveur et les passe au composant client
 */

import { ObjectService } from '@/lib/services';
import { ObjectsClient } from './objects-client';

export default async function ObjectsList() {
  // Récupération des données côté serveur
  let objects;
  try {
    objects = await ObjectService.findAll();
  } catch (error) {
    console.error('Erreur lors de la récupération des objets:', error);
    return (
      <div role="alert" className="flex items-center justify-center h-screen text-red-600">
        Erreur lors du chargement des objets
      </div>
    );
  }

  // Passer les données au composant client pour l'interactivité
  return <ObjectsClient initialObjects={objects} />;
}

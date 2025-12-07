/**
 * Page Server Component pour le détail d'un objet
 * Récupère les données côté serveur et les passe au composant client
 */

import { notFound, redirect } from 'next/navigation';
import { ObjectService } from '@/lib/services';
import { ObjectDetailClient } from './object-detail-client';
import LoadingIndicator from '@/components/LoadingIndicator';

type PageProps = {
  params: Promise<{ objectId: string }>;
};

export default async function ObjectDetail({ params }: PageProps) {
  const { objectId } = await params;

  if (!objectId) {
    redirect('/objects');
  }

  // Récupération des données côté serveur
  let object;
  try {
    object = await ObjectService.findById(objectId);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'objet:', error);
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">Erreur lors du chargement de l&apos;objet</p>
          </div>
        </div>
      </div>
    );
  }

  if (!object) {
    notFound();
  }

  // Passer les données au composant client pour l'interactivité
  return <ObjectDetailClient object={object} />;
}

'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ObjectData {
  id: string;
  nom: string;
  type: string;
  description: string;
  status: 'publie' | 'brouillon' | 'disponible' | 'indisponible';
  utilisateur: string;
  images: string[];
  photos?: Array<{ url: string; description: string[] }>;
}

interface User {
  id: string;
  login: string;
  status: string;
}

interface PageProps {
  params: Promise<{ objectId: string }>;
}

export default function ObjectDetail({ params }: PageProps): JSX.Element {
  const objectId = use(params).objectId;
  const router = useRouter();
  const [object, setObject] = useState<ObjectData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchObject = useCallback(async (): Promise<void> => {
    if (!objectId) return;

    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      const response = await fetch(`/api/objects/${objectId}`, {
        headers: {
          'x-user-data': currentUser
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la récupération de l\'objet');
      }

      const data = await response.json();
      
      const formattedData: ObjectData = {
        ...data,
        images: data.images || data.photos?.map((p: { url: string }) => p.url) || [],
        status: data.status || 'disponible'
      };

      setObject(formattedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur lors de la récupération des détails de l\'objet:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [objectId]);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      void router.push('/');
      return;
    }
    setUser(JSON.parse(currentUser));
    void fetchObject();
  }, [router, fetchObject]);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => router.push('/objects')}
            className="text-blue-600 hover:text-blue-800"
          >
            Retour à la liste des objets
          </button>
        </div>
      </div>
    );
  }

  if (!object) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <p>Objet non trouvé</p>
          <button
            onClick={() => router.push('/objects')}
            className="text-blue-600 hover:text-blue-800"
          >
            Retour à la liste des objets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{object.nom}</h1>
              <p className="text-sm text-gray-500">Type: {object.type}</p>
            </div>
            <button
              onClick={() => router.push('/objects')}
              className="text-gray-600 hover:text-gray-900"
            >
              Retour à la liste
            </button>
          </div>

          {object.description && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{object.description}</p>
            </div>
          )}

          {((object?.images && object.images.length > 0) || (object?.photos && object.photos.length > 0)) && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {object.images?.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image
                      src={image}
                      alt={`Image ${index + 1} de ${object.nom}`}
                      fill
                      className="object-cover rounded"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ))}
                {object.photos?.map((photo, index) => (
                  <div key={`photo-${index}`} className="relative aspect-square">
                    <Image
                      src={photo.url}
                      alt={`Image ${index + 1} de ${object.nom} - ${photo.description.join(', ')}`}
                      fill
                      className="object-cover rounded"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Créé par {object.utilisateur}
            </p>
            <p className="text-sm text-gray-500">
              Statut: {object.status === 'publie' ? 'Publié' : 'Brouillon'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { use, useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '../../../components/ImageWithFallback';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { ObjectData } from '../../../types/objects';

interface User {
  id: string;
  login: string;
  status: 'administrateur' | 'utilisateur';
}

interface PageProps {
  params: Promise<{ objectId: string }>;
}

const getStatusStyle = (status: string): string => {
  switch (status) {
    case 'publie':
      return 'text-white bg-green-500 px-3 py-1 rounded-full font-medium';
    case 'brouillon':
      return 'text-white bg-red-500 px-3 py-1 rounded-full font-medium';
    default:
      return 'text-gray-600';
  }
};

export default function ObjectDetail({ params }: PageProps): JSX.Element {
  const { objectId } = use(params);
  const router = useRouter();
  const [object, setObject] = useState<ObjectData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }
    if (objectId) {
      void fetchObject();
    }
  }, [objectId]);

  const fetchObject = async (): Promise<void> => {
    try {
      console.log('Fetching object with ID:', objectId);
      const response = await fetch(`/api/objects/${objectId}`);

      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Objet non trouvé' : 'Erreur lors de la récupération de l\'objet');
      }

      const data = await response.json();
      console.log('Received object data:', data);
      setObject(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching object:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingIndicator text="Chargement de l\'objet..." />;
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

  if (!object && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded shadow-md">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Objet non trouvé</h1>
          <p className="text-gray-600 mb-6">L'objet que vous cherchez n'existe pas ou n'a pas pu être chargé.</p>
          <Link href="/objects" className="text-blue-600 hover:text-blue-800">
            Retour à la liste des objets
          </Link>
        </div>
      </div>
    );
  }

  if (!object) {
    return <></>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow lg:grid lg:grid-cols-3 lg:gap-x-8 px-6 py-8">
          <div className="lg:col-span-1">
            {object?.photos && object.photos.length > 0 ? (
              <div className="space-y-4 mb-6">
                <h2 className="text-lg font-semibold mb-4 lg:hidden">Photos</h2>
                {object.photos.map((photo: ObjectData['photos'][number], index: number) => (
                  <div key={index} className="relative aspect-square">
                    <ImageWithFallback
                      src={photo.url}
                      alt={`Photo ${index + 1} de ${object.nom} - ${photo.description.join(', ')}`}
                      className="w-full h-full rounded shadow-md"
                      imgClassName="object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-square mb-6">
                <ImageWithFallback
                  alt={`Placeholder pour ${object?.nom || 'objet'}`}
                  className="w-full h-full rounded bg-gray-100"
                />
              </div>
            )}
          </div>
          <div className="lg:col-span-2 mt-8 lg:mt-0">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 pb-4 border-b border-gray-200">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{object?.nom}</h1>
                <p className="text-sm text-gray-500">Type: {object?.type}</p>
              </div>
              <div className="flex space-x-3 mt-4 sm:mt-0 flex-shrink-0">
                {user && object && (user.status === 'administrateur' || user.login === object.utilisateur) && (
                  <Link
                    href={`/objects/edit/${objectId}`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Modifier
                  </Link>
                )}
                <button
                  onClick={() => router.push('/objects')}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Retour
                </button>
              </div>
            </div>

            {object?.description && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-1">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{object.description}</p>
              </div>
            )}

            {object?.longDescription && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-1">Détails</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{object.longDescription}</p>
              </div>
            )}
          </div>
          {object && (
            <div className="lg:col-span-3 mt-8 pt-6 border-t border-gray-200 flex flex-wrap justify-between items-baseline gap-x-4 gap-y-2">
              <div className="text-sm">
                <span className="font-medium text-gray-500">Créé par: </span>
                <span className="text-gray-900">{object.utilisateur}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-500">Statut: </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${object.status === 'publie' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {object.status === 'publie' ? 'Publié' : 'Brouillon'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

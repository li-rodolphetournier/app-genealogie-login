'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ObjectData } from '@/types/objects';

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{object?.nom}</h1>
              <p className="text-sm text-gray-500">Type: {object?.type}</p>
            </div>
            <div className="flex space-x-4">
              {user && (user.status === 'administrateur' || user.login === object?.utilisateur) && (
                <Link 
                  href={`/objects/edit/${objectId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Modifier l&apos;objet
                </Link>
              )}
              
              <button
                onClick={() => router.push('/objects')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Retour à la liste
              </button>
            </div>
          </div>

          {object.description && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{object.description}</p>
            </div>
          )}

          {object?.photos && object.photos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Photos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {object.photos.map((photo, index) => {
                  console.log('Photo URL:', photo.url); // Debug log
                  return (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={photo.url}
                        alt={`Photo ${index + 1} de ${object.nom} - ${photo.description.join(', ')}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover rounded"
                        onError={(e) => console.error('Image load error:', e)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Créé par {object.utilisateur}
            </p>
            <div className={`status-badge ${object.status === 'brouillon' ? 'status-draft' : 'status-published'}`}>
              {object.status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

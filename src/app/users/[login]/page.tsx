'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface User {
  id: string;
  login: string;
  email: string;
  status: 'administrateur' | 'utilisateur';
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  profileImage?: string;
  description?: string;
}

interface PageProps {
  params: Promise<{ login: string }>;
}

export default function UserDetail({ params }: PageProps) {
  const { login } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
      setCurrentUser(JSON.parse(loggedInUser));
    }
    
    if (login) {
      void fetchUser();
    }
  }, [login]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${login}`);
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Utilisateur non trouvé' : 'Erreur lors de la récupération de l\'utilisateur');
      }
      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600" role="status">
          <span className="sr-only">Chargement...</span>
          Chargement...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => router.push('/users')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Retour à la liste des utilisateurs
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold text-gray-900" id="userDetailTitle">
                Profil de {user.prenom || ''} {user.nom || user.login}
              </h1>
              
              {currentUser && (currentUser.status === 'administrateur' || currentUser.login === user.login) && (
                <div className="flex space-x-4">
                  <Link
                    href={`/users/edit/${user.login}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    aria-label={`Modifier le profil de ${user.prenom || ''} ${user.nom || user.login}`}
                  >
                    Modifier le profil
                  </Link>
                  <button
                    onClick={() => router.push('/users')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Retour à la liste
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="relative h-64 w-64 mx-auto md:mx-0 rounded-lg overflow-hidden">
                  {user.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt={`Photo de profil de ${user.prenom || ''} ${user.nom || user.login}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">Pas de photo</span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h2>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Identifiant</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user.login}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h2>
                  <dl className="space-y-2">
                    {user.nom && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Nom</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user.nom}</dd>
                      </div>
                    )}
                    {user.prenom && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Prénom</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user.prenom}</dd>
                      </div>
                    )}
                    {user.dateNaissance && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Date de naissance</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(user.dateNaissance).toLocaleDateString('fr-FR')}
                        </dd>
                      </div>
                    )}
                    {user.description && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                          {user.description}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Statut</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'administrateur' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.status}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

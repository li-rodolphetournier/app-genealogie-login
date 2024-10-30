'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type User = {
  id: string;
  login: string;
  email: string;
  description: string;
  status: string;
  profileImage?: string;
};

export default function UserDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${id}`);
        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          setError('Utilisateur non trouvé');
        }
      } catch (error) {
        if (isMounted) {
          setError('Erreur lors de la récupération des données');
          console.error('Erreur:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div role="alert" className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="sr-only">Chargement...</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">{error || 'Utilisateur non trouvé'}</p>
        <Link
          href="/users"
          className="text-blue-500 hover:underline"
        >
          Retour à la liste des utilisateurs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête fixe */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Détails de l&apos;utilisateur
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Informations complètes du profil
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href={`/users/edit/${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg 
                  className="-ml-1 mr-2 h-5 w-5" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Modifier
              </Link>
              <Link
                href="/users"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retour à la liste
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full mx-auto">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-8">
              {/* En-tête du profil */}
              <div className="flex items-center space-x-6 mb-8">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={`Photo de profil de ${user.login}`}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl font-semibold text-gray-600">
                      {user.login.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {user.login}
                  </h2>
                  <p className="text-lg text-gray-500 mt-1">{user.email}</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                    user.status === 'administrateur' 
                      ? 'bg-purple-100 text-purple-800'
                      : user.status === 'redacteur'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Description
                </h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700">
                    {user.description || 'Aucune description disponible'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
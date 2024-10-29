'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type User = {
  login: string;
  status: string;
};

export default function Accueil() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    } else {
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  if (!user) {
    return <div role="alert">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm" role="banner">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Connecté en tant que <span className="font-medium">{user.login}</span>
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              aria-label="Se déconnecter"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="navigation" aria-label="Menu principal">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Liste des objets */}
          <Link
            href="/objects"
            className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            aria-label="Accéder à la liste des objets"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-medium text-gray-900">Liste des objets</h2>
                <p className="mt-1 text-sm text-gray-500">Voir tous les objets disponibles</p>
              </div>
            </div>
          </Link>

          {/* Créer un objet - accessible aux rédacteurs et administrateurs */}
          {user.status !== 'utilisateur' && (
            <Link
              href="/objects/create"
              className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              aria-label="Créer un nouvel objet"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-medium text-gray-900">Créer un objet</h2>
                  <p className="mt-1 text-sm text-gray-500">Ajouter un nouvel objet</p>
                </div>
              </div>
            </Link>
          )}

          {/* Administration - accessible aux administrateurs */}
          {user.status === 'administrateur' && (
            <>
              <Link
                href="/users"
                className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                aria-label="Accéder à la gestion des utilisateurs"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">Gestion des utilisateurs</h2>
                    <p className="mt-1 text-sm text-gray-500">Administrer les comptes utilisateurs</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/chart"
                className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-yellow-500 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                aria-label="Accéder aux statistiques"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-yellow-500 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">Statistiques</h2>
                    <p className="mt-1 text-sm text-gray-500">Voir les statistiques des objets</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/genealogie"
                className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                aria-label="Accéder à l'arbre généalogique"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">Généalogie</h2>
                    <p className="mt-1 text-sm text-gray-500">Visualiser l'arbre généalogique</p>
                  </div>
                </div>
              </Link>
            </>
          )}

          {/* Modifier mon profil - accessible à tous */}
          <Link
            href="/admin"
            className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-pink-500 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            aria-label="Modifier mon profil"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-pink-500 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-medium text-gray-900">Mon profil</h2>
                <p className="mt-1 text-sm text-gray-500">Modifier mes informations personnelles</p>
              </div>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
}

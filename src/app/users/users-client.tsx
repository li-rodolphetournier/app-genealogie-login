'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { getErrorMessage } from '@/lib/errors/messages';
import ImageWithFallback from '@/components/ImageWithFallback';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { ProfileImage } from '@/components/ProfileImage';
import { BackToHomeButton } from '@/components/navigation';
import { PageTransition } from '@/components/animations';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/types/user';

type UsersClientProps = {
  initialUsers: User[];
};

export function UsersClient({ initialUsers }: UsersClientProps) {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [users] = useState<User[]>(initialUsers);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const isAdmin = currentUser?.status === 'administrateur';
  
  // Fonction pour vérifier si un utilisateur peut être supprimé
  const canDeleteUser = (user: User) => {
    return isAdmin && user.status !== 'administrateur';
  };

  const handleDeleteClick = (userLogin: string) => {
    setUserToDelete(userLogin);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Utilisateur supprimé avec succès', 'success');
        // Recharger la page après un court délai pour voir le message de succès
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        const data = await response.json().catch(() => ({}));
        const errorMessage = data.error || getErrorMessage('USER_DELETE_FAILED');
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setIsModalOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* En-tête fixe */}
      <header role="banner" className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Liste des utilisateurs
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gérez les utilisateurs de l&apos;application
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                aria-label={`Basculer en mode ${viewMode === 'grid' ? 'liste' : 'grille'}`}
              >
                {viewMode === 'grid' ? (
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )}
                {viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
              </button>
              <Link
                href="/create-user"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Créer un utilisateur
              </Link>
              <BackToHomeButton />
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main role="main" className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full mx-auto">
          {viewMode === 'grid' ? (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {users.map((user) => (
                  <div
                    key={user.login}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-6">
                      <div className="flex flex-col items-center space-y-4">
                        <ProfileImage
                          src={user.profileImage}
                          alt={`Photo de profil de ${user.login}`}
                          fallbackText={user.login}
                          size={128}
                        />
                        <div className="text-center">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {user.login}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'administrateur'
                            ? 'bg-purple-100 text-purple-800'
                            : user.status === 'redacteur'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status}
                        </span>
                      </div>

                      <div className="mt-4 flex justify-center space-x-2">
                        <Link
                          href={`/users/${user.login}`}
                          className="text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                        >
                          Voir détails
                        </Link>
                        <Link
                          href={`/users/edit/${user.login}`}
                          className="text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 font-medium text-sm"
                        >
                          Modifier
                        </Link>
                        {canDeleteUser(user) && (
                          <button
                            onClick={() => handleDeleteClick(user.login)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <li key={user.login} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center space-x-4">
                      <ProfileImage
                        src={user.profileImage}
                        alt={`Photo de profil de ${user.login}`}
                        fallbackText={user.login}
                        size={48}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.login}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'administrateur'
                            ? 'bg-purple-100 text-purple-800'
                            : user.status === 'redacteur'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status}
                        </span>
                        <div className="flex space-x-2">
                          <Link
                            href={`/users/${user.login}`}
                            className="text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
                          >
                            Voir
                          </Link>
                          <Link
                            href={`/users/edit/${user.login}`}
                            className="text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 font-medium text-sm"
                          >
                            Modifier
                          </Link>
                          {canDeleteUser(user) && (
                            <button
                              onClick={() => handleDeleteClick(user.login)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </main>

      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        message={userToDelete ? `Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete}" ? Cette action est irréversible.` : ''}
      />
      </div>
    </PageTransition>
  );
}


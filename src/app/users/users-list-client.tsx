'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { getErrorMessage } from '@/lib/errors/messages';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import LoadingIndicator from '@/components/LoadingIndicator';
import { UserCard } from '@/components/cards/UserCard';
import { ProfileImage } from '@/components/ProfileImage';
import type { User } from '@/types/user';

type UsersListClientProps = {
  initialUsers: User[];
};

export function UsersListClient({ initialUsers }: UsersListClientProps) {
  const { showToast } = useToast();
  const [users] = useState<User[]>(initialUsers);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleDeleteClick = useCallback((userLogin: string) => {
    setUserToDelete(userLogin);
    setIsModalOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        showToast(getErrorMessage('USER_DELETE_FAILED'), 'error');
      }
    } catch (error) {
      console.error('Erreur:', error);
        showToast(getErrorMessage('USER_DELETE_FAILED'), 'error');
    } finally {
      setIsModalOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {viewMode === 'grid' ? 'Liste' : 'Grille'}
              </button>
              <Link
                href="/create-user"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Créer un utilisateur
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <UserCard
                key={user.login}
                user={user}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.login}>
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <ProfileImage
                        src={user.profileImage}
                        alt={user.login}
                        fallbackText={user.login}
                        size={40}
                      />
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">{user.login}</p>
                          <span className={`ml-2 px-2 py-1 text-xs rounded ${
                            user.status === 'administrateur' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/users/${user.login}`}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Voir
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(user.login)}
                        className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        )}
      </main>

      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userToDelete} ?`}
      />
    </div>
  );
}


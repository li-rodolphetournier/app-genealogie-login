'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ProfileImage } from '@/components/ProfileImage';
import type { User } from '@/types/user';

type UserDetailClientProps = {
  user: User;
};

export function UserDetailClient({ user }: UserDetailClientProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const canEdit = currentUser && (currentUser.status === 'administrateur' || currentUser.login === user.login);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold text-gray-900" id="userDetailTitle">
                Profil de {user.prenom || ''} {user.nom || user.login}
              </h1>

              {canEdit && (
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
                <div className="relative h-64 w-64 mx-auto md:mx-0 rounded-lg overflow-hidden flex items-center justify-center">
                  <ProfileImage
                    src={user.profileImage}
                    alt={`Photo de profil de ${user.prenom || ''} ${user.nom || user.login}`}
                    fallbackText={user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.login}
                    size={256}
                    className="rounded-lg"
                  />
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


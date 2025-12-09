/**
 * Composant UserCard optimisé avec React.memo
 */

'use client';

import React from 'react';
import Link from 'next/link';
import type { User } from '@/types/user';
import { ProfileImage } from '@/components/ProfileImage';

type UserCardProps = {
  user: User;
  onDelete?: (login: string) => void;
};

export const UserCard = React.memo<UserCardProps>(({ user, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <ProfileImage
          src={user.profileImage}
          alt={`Photo de profil de ${user.login}`}
          fallbackText={user.login}
          size={64}
        />
        <span
          className={`px-2 py-1 text-xs rounded ${
            user.status === 'administrateur'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {user.status}
        </span>
      </div>
      <h3 className="text-lg font-semibold">{user.login}</h3>
      <p className="text-sm text-gray-600">{user.email}</p>
      {user.description && (
        <p className="text-sm text-gray-500 mt-2">{user.description}</p>
      )}
      <div className="mt-4 flex space-x-2">
        <Link
          href={`/users/${user.login}`}
          className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Voir
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(user.login)}
            className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            aria-label={`Supprimer ${user.login}`}
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
});

UserCard.displayName = 'UserCard';


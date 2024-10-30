'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type User = {
  login: string;
  email: string;
  description: string;
  status: string;
  profileImage?: string;
};

export default function UserDetails() {
  const { login } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${login}`);
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
  }, [login]);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>Erreur: {error}</div>;
  }

  if (!user) {
    return <div>Utilisateur non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Détails de l'utilisateur</h1>
      
      {/* Informations de base */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-start space-x-4">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={`Photo de profil de ${user.login}`}
              className="w-32 h-32 object-cover rounded-lg"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-300 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-gray-600 font-bold">
                {user.login.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">{user.login}</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Statut:</span> {user.status}</p>
              <p><span className="font-medium">Description:</span></p>
              <p className="text-gray-600">{user.description || 'Aucune description'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton de retour */}
      <div className="mt-4">
        <Link href="/users" className="text-blue-500 hover:underline">
          Retour à la liste des utilisateurs
        </Link>
      </div>
    </div>
  );
}

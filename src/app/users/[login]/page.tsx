'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '../../../components/Layout';
import Link from 'next/link';

type User = {
  login: string;
  email: string;
  description: string;
  profileImage: string;
  status: 'administrateur' | 'redacteur' | 'utilisateur';
  password: string;
};

const UserDetails = () => {
  const { login } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [userObjects, setUserObjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserAndObjects = async () => {
      try {
        // Charger les données des utilisateurs
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          const currentUser = users.find((u: User) => u.login === login);
          if (currentUser) {
            setUser(currentUser);
          }
        }

        // Charger les objets de l'utilisateur
        const objectsResponse = await fetch('/api/objects');
        if (objectsResponse.ok) {
          const objects = await objectsResponse.json();
          const userObjects = objects.filter((obj: any) => obj.utilisateur === login);
          setUserObjects(userObjects);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchUserAndObjects();
  }, [login]);

  if (!user) {
    return <Layout><div>Chargement...</div></Layout>;
  }

  return (
    <Layout>
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

        {/* Objets de l'utilisateur */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Objets de l'utilisateur</h2>
          {userObjects.length > 0 ? (
            <div className="space-y-4">
              {userObjects.map((object) => (
                <div key={object.id} className="border p-4 rounded-lg">
                  <h3 className="font-medium">{object.nom}</h3>
                  <p className="text-gray-600">Type: {object.type}</p>
                  <p className="text-gray-600">Statut: {object.status}</p>
                  {object.photos && object.photos.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Photos:</p>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {object.photos.map((photo: any, index: number) => (
                          <div key={index} className="relative">
                            <img
                              src={photo.url}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-24 object-cover rounded"
                            />
                            {photo.description && photo.description.length > 0 && (
                              <div className="text-xs mt-1">
                                {photo.description.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Aucun objet trouvé pour cet utilisateur</p>
          )}
        </div>

        {/* Bouton de retour */}
        <div className="mt-4">
          <Link href="/users" className="text-blue-500 hover:underline">
            Retour à la liste des utilisateurs
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default UserDetails;

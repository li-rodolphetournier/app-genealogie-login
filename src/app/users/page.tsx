'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../components/Layout';

type User = {
  login: string;
  email: string;
  status: 'administrateur' | 'redacteur' | 'utilisateur';
  profileImage?: string;
  description: string;
};

export default function UsersList() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      if (user.status !== 'administrateur') {
        router.push('/accueil');
      } else {
        fetchUsers();
      }
    } else {
      router.push('/');
    }
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();
        setAllUsers(users);
      } else {
        console.error('Erreur lors de la récupération des utilisateurs');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    }
  };

  if (!currentUser || currentUser.status !== 'administrateur') {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Liste des utilisateurs</h1>
        <Link 
          href="/create-user" 
          className="mb-6 inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Créer un nouvel utilisateur
        </Link>
        <div className="mt-4 space-y-4">
          {allUsers.map((user) => (
            <div 
              key={user.login} 
              className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={`${user.login} profile`} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-xl text-gray-600 font-bold">
                      {user.login.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold">{user.login}</h2>
                  <p className="text-sm text-gray-600">{user.status}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link 
                  href={`/users/${user.login}`}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Voir détails
                </Link>
                <Link 
                  href={`/users/edit/${user.login}`}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Éditer
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/accueil" className="text-blue-500 hover:underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </Layout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Button from '../../components/Button';

type User = {
  email: string;
  password: string;
  login: string;
  description: string;
  profileImage: string;
  status: 'administrateur' | 'redacteur' | 'utilisateur';
};

export default function Accueil() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      console.log('Données utilisateur:', userData); // Pour déboguer
      setUser(userData);
    } else {
      router.push('/');
    }
  }, [router]);

  if (!user) {
    return <div>Chargement...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  console.log('Image de profil:', user.profileImage); // Pour déboguer

  return (
    <Layout>
      <div className="flex flex-col items-center space-y-4">
        {user.profileImage && user.profileImage !== '' ? (
          <div className="w-24 h-24 relative">
            <img
              src={user.profileImage}
              alt={`Photo de profil de ${user.login}`}
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                console.error('Erreur de chargement de l\'image:', e);
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/default-avatar.png'; // Image par défaut si l'image de profil ne charge pas
              }}
            />
          </div>
        ) : (
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xl text-gray-600 font-semibold">
              {user.login.slice(0, 3).toUpperCase()}
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold text-center">Bienvenue, {user.login}!</h1>
        <p className="text-gray-600">{user.description}</p>
      </div>
      <div className="mt-4 space-y-2">
        <Link href="/admin" className="block w-full">
          <Button className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500">
            Modifier mon profil
          </Button>
        </Link>
        <Link href="/objects" className="block w-full">
          <Button className="bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500">
            Liste des objets
          </Button>
        </Link>
        {user.status !== 'utilisateur' && (
          <Link href="/objects/create" className="block w-full">
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500">
              Créer un nouvel objet
            </Button>
          </Link>
        )}
        {user.status === 'administrateur' && (
          <>
            <Link href="/users" className="block w-full">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">
                Liste des utilisateurs
              </Button>
            </Link>
            <Link href="/chart" className="block w-full">
              <Button className="bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500">
                Statistiques
              </Button>
            </Link>
            <Link href="/genealogie" className="block w-full">
              <Button className="bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500">
                Généalogie
              </Button>
            </Link>
          </>
        )}
        <Button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
        >
          Se déconnecter
        </Button>
      </div>
    </Layout>
  );
}

/**
 * Page Server Component pour le détail d'un utilisateur
 * Récupère les données côté serveur et les passe au composant client
 */

import { notFound } from 'next/navigation';
import { UserService } from '@/lib/services';
import { UserDetailClient } from './user-detail-client';

type PageProps = {
  params: Promise<{ login: string }>;
};

export default async function UserDetail({ params }: PageProps) {
  const { login } = await params;

  if (!login) {
    notFound();
  }

  // Récupération des données côté serveur
  let user;
  try {
    user = await UserService.findByLogin(login);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
            <p className="text-red-700">Erreur lors du chargement de l&apos;utilisateur</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    notFound();
  }

  // Passer les données au composant client pour l'interactivité
  return <UserDetailClient user={user} />;
}

/**
 * Page Server Component pour la liste des utilisateurs
 * Récupère les données côté serveur et les passe au composant client
 */

import { UserService } from '@/lib/services';
import { UsersClient } from './users-client';

export default async function UsersList() {
  // Récupération des données côté serveur
  let users;
  try {
    users = await UserService.findAll();
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return (
      <div role="alert" className="flex items-center justify-center h-screen text-red-600">
        Erreur lors du chargement des utilisateurs
      </div>
    );
  }

  // Passer les données au composant client pour l'interactivité
  return <UsersClient initialUsers={users} />;
}

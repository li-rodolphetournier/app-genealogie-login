'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  login: string;
  status: 'administrateur' | 'utilisateur';
}

export default function CreateObject() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState<'brouillon' | 'publie'>('brouillon');
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Récupérer l'utilisateur connecté depuis le localStorage
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    } else {
      // Rediriger vers la page de connexion si aucun utilisateur n'est connecté
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setError('Vous devez être connecté pour créer un objet');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nom', nom);
      formData.append('type', type);
      formData.append('status', status);
      formData.append('utilisateur', user.login);

      // Ajouter les photos si présentes
      photos.forEach(photo => {
        formData.append('photos', photo);
      });

      const response = await fetch('/api/objects/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de l\'objet');
      }

      router.push('/objects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-bold mb-6">Créer un nouvel objet</h1>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                  Nom de l'objet
                </label>
                <input
                  type="text"
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  className="mt-1 block w-full"
                  placeholder="Saisissez le nom de l'objet"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Catégorie
                </label>
                <input
                  type="text"
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                  className="mt-1 block w-full"
                  placeholder="Saisissez la catégorie"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  État de publication
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'brouillon' | 'publie')}
                  className="mt-1 block w-full"
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="publie">Publié</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Photos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && setPhotos(Array.from(e.target.files))}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  lang="fr"
                  aria-label="Sélectionner des photos"
                  title="Cliquez pour ajouter des photos"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Formats acceptés : JPG, PNG, GIF
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/objects')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Créer l'objet
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

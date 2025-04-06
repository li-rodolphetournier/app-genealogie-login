'use client';

import { useEffect, useState } from 'react';

import GenericImageUploader from '../../components/ImageUploader';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type User = {
  login: string;
  email: string;
  description: string;
  detail?: string;
  status: string;
  profileImage?: string;
};

export default function EditProfile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    description: '',
    detail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profileImage: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(currentUser);
    setUser(userData);
    setFormData(prev => ({
      ...prev,
      email: userData.email || '',
      description: userData.description || '',
      detail: userData.detail || '',
      profileImage: userData.profileImage || ''
    }));
  }, [router]);

  const handleImageUploadSuccess = (imageUrl: string) => {
    console.log('DEBUG: Nouvelle image de profil sélectionnée:', imageUrl);
    setFormData(prev => ({
      ...prev,
      profileImage: imageUrl
    }));
    setError(null);
    setSuccess(null);
  };

  const handleImageUploadError = (errorMessage: string) => {
    console.error("Upload error:", errorMessage);
    setError(`Erreur d'upload: ${errorMessage}`);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      setError('Le mot de passe actuel est requis pour changer le mot de passe.');
      return;
    }

    try {
      const response = await fetch(`/api/users/${user?.login}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          description: formData.description,
          detail: formData.detail,
          profileImage: formData.profileImage
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        const fullUserForStorage = { ...user, ...updatedUser };
        localStorage.setItem('currentUser', JSON.stringify(fullUserForStorage));
        setUser(fullUserForStorage);
        setSuccess('Profil mis à jour avec succès');
        setFormData(prev => ({
          ...prev,
          email: updatedUser.email || '',
          description: updatedUser.description || '',
          detail: updatedUser.detail || '',
          profileImage: updatedUser.profileImage || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const data = await response.json();
        setError(data.message || 'Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      setError('Erreur lors de la mise à jour du profil');
      console.error('Erreur:', error);
    }
  };

  if (!user) {
    return (
      <div role="alert" className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="sr-only">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Modifier mon profil
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Mettez à jour vos informations personnelles
              </p>
            </div>
            <Link
              href="/accueil"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Erreur !</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}

            {success && (
              <div role="status" className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Succès !</strong>
                <span className="block sm:inline"> {success}</span>
              </div>
            )}

            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Informations personnelles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="detail" className="block text-sm font-medium text-gray-700">
                    Détail (Plusieurs paragraphes)
                  </label>
                  <textarea
                    id="detail"
                    name="detail"
                    value={formData.detail}
                    onChange={handleChange}
                    rows={6}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="Entrez des informations plus détaillées ici..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Photo de profil
              </h2>
              <div className="mt-1 flex items-center space-x-4">
                {formData.profileImage ? (
                  <img src={formData.profileImage} alt="Photo de profil actuelle" className="h-16 w-16 rounded-full object-cover border border-gray-300" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                    <span className="text-xl text-gray-500">
                      {user?.login.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <GenericImageUploader
                  onUploadSuccess={handleImageUploadSuccess}
                  onError={handleImageUploadError}
                >
                  <button type="button" className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Modifier l'image
                  </button>
                </GenericImageUploader>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Modifier le mot de passe
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    minLength={6}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useState } from 'react';

import GenericImageUploader from '../../components/ImageUploader';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/animations';

type User = {
  login: string;
  email: string;
  password: string;
  description: string;
  detail?: string;
  status: 'administrateur' | 'redacteur' | 'utilisateur';
  profileImage?: string;
};

export default function CreateUser() {
  const router = useRouter();
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    login: '',
    email: '',
    password: '',
    description: '',
    detail: '',
    status: 'utilisateur',
    profileImage: undefined
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleImageUploadSuccess = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      profileImage: imageUrl
    }));
    setError(null);
  };

  const handleImageUploadError = (errorMessage: string) => {
    console.error("Upload error:", errorMessage);
    setError(`Erreur d'upload: ${errorMessage}`);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (formData.password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Upload de l'image si présente
      let profileImageUrl: string | undefined = formData.profileImage;
      if (!profileImageUrl && formData.profileImage) {
        // Si l'image n'a pas été uploadée via GenericImageUploader, on la garde telle quelle
        profileImageUrl = formData.profileImage;
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: formData.login,
          email: formData.email,
          password: formData.password,
          status: formData.status,
          description: formData.description,
          profileImage: profileImageUrl,
        }),
      });

      if (response.ok) {
        setSuccess("Utilisateur créé avec succès !");
        setTimeout(() => router.push('/users'), 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erreur lors de la création de l utilisateur');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.';
      setError(errorMessage);
      console.error('Erreur lors de la création:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Créer un nouvel utilisateur
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Remplissez les informations pour créer un nouvel utilisateur
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/users"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annuler
              </Link>
            </div>
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
                Informations de l&apos;utilisateur
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="login" className="block text-sm font-medium text-gray-700">
                    Login
                  </label>
                  <input
                    type="text"
                    id="login"
                    name="login"
                    value={formData.login}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    aria-required="true"
                  />
                </div>

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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    aria-required="true"
                    minLength={6}
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Statut
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    aria-required="true"
                  >
                    <option value="utilisateur">Utilisateur</option>
                    <option value="redacteur">Rédacteur</option>
                    <option value="administrateur">Administrateur</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Informations complémentaires
              </h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description (Courte)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="detail" className="block text-sm font-medium text-gray-700">
                    Détail (Plusieurs paragraphes)
                  </label>
                  <textarea
                    id="detail"
                    name="detail"
                    value={formData.detail}
                    onChange={handleChange}
                    rows={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Entrez des informations plus détaillées ici..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo de profil (Optionnel)
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    {formData.profileImage ? (
                      <img src={formData.profileImage} alt="Aperçu" className="h-16 w-16 rounded-full object-cover border border-gray-300" />
                    ) : (
                      <span className="inline-block h-16 w-16 rounded-full overflow-hidden bg-gray-100 border border-gray-300">
                        <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </span>
                    )}
                    <GenericImageUploader
                      onUploadSuccess={handleImageUploadSuccess}
                      onError={handleImageUploadError}
                      folder="users"
                    >
                      <button type="button" className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Choisir une image
                      </button>
                    </GenericImageUploader>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
              >
                {isSubmitting ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {isSubmitting ? 'Création...' : 'Créer nouvel utilisateur'}
              </button>
            </div>
          </form>
        </div>
      </main>
      </div>
    </PageTransition>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Image from 'next/image';
import Link from 'next/link';
import { ProfileImage } from '@/components/ProfileImage';
import { PageTransition } from '@/components/animations';
import { FileUploader } from '@/components/file-uploader';

type User = {
  login: string;
  email: string;
  description: string;
  status: string;
  profileImage?: string;
};

export default function EditUser() {
  const params = useParams();
  const login = params?.login as string;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<User>({
    login: '',
    email: '',
    description: '',
    status: '',
    profileImage: undefined
  });
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${login}`);
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setFormData({
            login: data.login || '',
            email: data.email || '',
            description: data.description || '',
            status: data.status || '',
            profileImage: data.profileImage
          });
        }
      } catch (error) {
        setError('Erreur lors de la récupération des données utilisateur');
        console.error('Erreur:', error);
      }
    };

    fetchUser();
  }, [login]);

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setPhotoFile(files[0]);
    }
  };

  const handleUploadComplete = (urls: string[]) => {
    if (urls.length > 0) {
      setUploadedImageUrl(urls[0]);
      setFormData(prev => ({
        ...prev,
        profileImage: urls[0]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Utiliser l'URL déjà uploadée si disponible, sinon utiliser celle du formulaire
      let profileImageUrl = uploadedImageUrl || formData.profileImage;

      // Si une nouvelle photo a été sélectionnée mais pas encore uploadée, l'uploader
      if (photoFile && !uploadedImageUrl) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', photoFile);
        uploadFormData.append('folder', 'users');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Erreur lors de l\'upload de l\'image');
        }

        const uploadData = await uploadResponse.json();
        profileImageUrl = uploadData.imageUrl || uploadData.url;
      }

      // Envoyer les données en JSON avec l'URL de l'image
      const response = await fetch(`/api/users/${login}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: formData.login,
          email: formData.email,
          description: formData.description,
          status: formData.status,
          profileImage: profileImageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de l\'utilisateur');
      }

      // Rediriger vers le nouveau login si il a changé, sinon vers l'ancien
      const responseData = await response.json();
      const newLogin = responseData.data?.login || formData.login;
      router.push(`/users/${newLogin}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Modifier l&apos;utilisateur {formData.login || login}
          </h1>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 mb-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Login:</label>
              <input
                type="text"
                id="login"
                name="login"
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                required
                minLength={3}
                maxLength={50}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                rows={4}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut:</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                required
              >
                <option value="utilisateur">Utilisateur</option>
                <option value="administrateur">Administrateur</option>
              </select>
            </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Photo de profil:</label>
          <div className="mt-1 flex items-center space-x-4">
            <div className="flex-shrink-0">
              <ProfileImage
                src={uploadedImageUrl || formData.profileImage}
                alt="Photo de profil actuelle"
                fallbackText={user?.login || 'User'}
                size={96}
                className=""
              />
            </div>
            <div className="flex-1">
              <FileUploader
                onFileSelect={handleFileSelect}
                onUploadComplete={handleUploadComplete}
                onError={(errorMessage) => setError(errorMessage)}
                folder="users"
                maxFileSizeMB={2}
                multiple={false}
                accept="image/*"
              />
            </div>
          </div>
        </div>

            <div className="flex justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href={`/users/${login}`}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Annuler
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </PageTransition>
  );
} 
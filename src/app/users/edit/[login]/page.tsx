'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Image from 'next/image';
import Link from 'next/link';
import { ProfileImage } from '@/components/ProfileImage';
import { PageTransition } from '@/components/animations';

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      let profileImageUrl = formData.profileImage;

      // Si une nouvelle photo a été sélectionnée, l'uploader d'abord
      if (photoFile) {
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
      <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        Modifier l&apos;utilisateur {formData.login || login}
      </h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login" className="block mb-1">Login:</label>
          <input
            type="text"
            id="login"
            name="login"
            value={formData.login}
            onChange={(e) => setFormData({ ...formData, login: e.target.value })}
            className="w-full border rounded p-2"
            required
            minLength={3}
            maxLength={50}
          />
        </div>

        <div>
          <label htmlFor="email" className="block mb-1">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block mb-1">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border rounded p-2"
            rows={4}
          />
        </div>

        <div>
          <label htmlFor="status" className="block mb-1">Statut:</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full border rounded p-2"
            required
          >
            <option value="utilisateur">Utilisateur</option>
            <option value="administrateur">Administrateur</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Photo de profil:</label>
          <ProfileImage
            src={formData.profileImage}
            alt="Photo de profil actuelle"
            fallbackText={user?.login || 'User'}
            size={128}
            className="mb-2"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full"
          />
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Enregistrer les modifications
          </button>
          <Link
            href={`/users/${login}`}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Annuler
          </Link>
        </div>
      </form>
      </div>
    </PageTransition>
  );
} 
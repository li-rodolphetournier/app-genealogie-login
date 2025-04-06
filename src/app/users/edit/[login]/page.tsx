'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Image from 'next/image';
import Link from 'next/link';

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
  const [formData, setFormData] = useState<Omit<User, 'login'>>({
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
      const formDataToSend = new FormData();

      // Ajouter tous les champs au FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Ajouter la photo si elle a été sélectionnée
      if (photoFile) {
        formDataToSend.append('profileImage', photoFile);
      }

      const response = await fetch(`/api/users/${login}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'utilisateur');
      }

      router.push(`/users/${login}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Modifier l&apos;utilisateur {login}</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          {formData.profileImage && (
            <div className="mb-2">
              <Image
                src={formData.profileImage}
                alt="Photo de profil actuelle"
                width={128}
                height={128}
                className="rounded object-cover"
              />
            </div>
          )}
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
  );
} 
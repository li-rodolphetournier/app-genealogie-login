'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '../../../../components/ImageUploader';

type User = {
  login: string;
  email: string;
  description: string;
  status: string;
  profileImage?: string;
};

export default function EditUser() {
  const { login } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Omit<User, 'login'>>({
    email: '',
    description: '',
    status: '',
    profileImage: undefined
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${login}`);
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setFormData({
            email: data.email,
            description: data.description,
            status: data.status,
            profileImage: data.profileImage
          });
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    };

    fetchUser();
  }, [login]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/users/${login}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/users/${login}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Modifier l&apos;utilisateur {login}</h1>
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
            <option value="redacteur">Rédacteur</option>
            <option value="administrateur">Administrateur</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Photo de profil:</label>
          <ImageUploader onUpload={(imageUrls) => setFormData({ ...formData, profileImage: imageUrls[0] })} type="user" />
          {formData.profileImage && (
            <img
              src={formData.profileImage}
              alt="Preview"
              className="mt-2 w-32 h-32 object-cover rounded"
            />
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Enregistrer les modifications
          </button>
          <Link
            href={`/users/${login}`}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
} 
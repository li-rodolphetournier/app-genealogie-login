'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../../components/Layout';
import Link from 'next/link';
import ImageUploader from '../../../../components/ImageUploader';

type User = {
  login: string;
  email: string;
  description: string;
  status: 'administrateur' | 'redacteur' | 'utilisateur';
  profileImage?: string;
};

export default function EditUser() {
  const { login } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    description: '',
    status: '',
    profileImage: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${login}`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setFormData({
            email: userData.email,
            description: userData.description || '',
            status: userData.status,
            profileImage: userData.profileImage || '',
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchUser();
  }, [login]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (imageUrls: string[]) => {
    if (imageUrls.length > 0) {
      setFormData(prev => ({
        ...prev,
        profileImage: imageUrls[0],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        router.push('/users');
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour de l\'utilisateur');
    }
  };

  if (!user) {
    return <Layout><div>Chargement...</div></Layout>;
  }

  return (
    <Layout>
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
            <ImageUploader onUpload={handleImageUpload} type="user" />
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
              href="/users"
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
} 
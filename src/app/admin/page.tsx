'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import ImageUploader from '../../components/ImageUploader';

type User = {
  login: string;
  email: string;
  description: string;
  profileImage: string;
};

const AdminPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    description: '',
    profileImage: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setFormData({
            email: userData.email,
            description: userData.description,
            profileImage: userData.profileImage,
          });
        } else {
          const errorData = await response.json();
          console.error('Erreur lors de la récupération des données utilisateur:', errorData.message);
          alert(`Erreur lors de la récupération des données utilisateur: ${errorData.message}`);
        }
      } catch (error) {
        console.error('Erreur réseau:', error);
        alert(`Une erreur réseau est survenue: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageUpload = (imageUrls: string[]) => {
    if (imageUrls.length > 0) {
      setFormData(prevData => ({
        ...prevData,
        profileImage: imageUrls[0],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Profil mis à jour avec succès');
        // Modifions cette ligne pour rediriger vers la bonne page
        router.push('/users'); // ou '/dashboard' ou toute autre page appropriée
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la mise à jour du profil:', errorData);
        alert(`Erreur lors de la mise à jour du profil: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Erreur réseau lors de la mise à jour du profil:', error);
      alert(`Une erreur est survenue lors de la mise à jour du profil: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (!user) {
    return <Layout><div>Chargement...</div></Layout>;
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Modifier le profil</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label htmlFor="description" className="block">Description:</label>
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
          <label className="block">Image de profil:</label>
          <ImageUploader onUpload={handleImageUpload} type="user" />
          {formData.profileImage && (
            <img src={formData.profileImage} alt="Profile" className="mt-2 w-32 h-32 object-cover" />
          )}
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Mettre à jour le profil
        </button>
      </form>
    </Layout>
  );
};

export default AdminPage;

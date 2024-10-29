'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import ImageUploader from '../../components/ImageUploader';

const CreateUser = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    email: '',
    description: '',
    profileImage: '',
    status: 'utilisateur', // Valeur par défaut
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Utilisateur créé avec succès:', data);
        router.push('/users');
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de la création de l\'utilisateur:', errorData);
        alert(`Erreur lors de la création de l'utilisateur: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Erreur réseau lors de la création de l\'utilisateur:', error);
      alert(`Une erreur réseau est survenue lors de la création de l'utilisateur: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Créer un nouvel utilisateur</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login" className="block">Login:</label>
          <input
            type="text"
            id="login"
            name="login"
            value={formData.login}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block">Mot de passe:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
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
          <label htmlFor="status" className="block">Statut:</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option value="utilisateur">Utilisateur</option>
            <option value="administrateur">Administrateur</option>
            <option value="redacteur">Rédacteur</option>
          </select>
        </div>
        <div>
          <label className="block">Image de profil:</label>
          <ImageUploader onUpload={handleImageUpload} type="user" />
          {formData.profileImage && (
            <img src={formData.profileImage} alt="Profile" className="mt-2 w-32 h-32 object-cover" />
          )}
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Créer l'utilisateur
        </button>
      </form>
    </Layout>
  );
};

export default CreateUser;

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '../../components/ImageUploader';

type User = {
  login: string;
  email: string;
  password: string;
  description: string;
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
    status: 'utilisateur',
    profileImage: undefined
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (imageUrls: string[]) => {
    if (imageUrls.length > 0) {
      setFormData(prev => ({
        ...prev,
        profileImage: imageUrls[0]
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
        router.push('/users');
      } else {
        const error = await response.json();
        alert(`Erreur lors de la création : ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de l&apos;utilisateur');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête fixe */}
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

      {/* Contenu principal */}
      <main className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
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

            {/* Description et image */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Informations complémentaires
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Photo de profil
                  </label>
                  <div className="mt-1 flex items-center space-x-6">
                    <ImageUploader onUpload={handleImageUpload} type="user" />
                    {formData.profileImage && (
                      <div className="relative">
                        <img
                          src={formData.profileImage}
                          alt="Prévisualisation"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton de soumission */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Créer l&apos;utilisateur
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

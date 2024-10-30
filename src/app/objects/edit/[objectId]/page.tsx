'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '../../../../components/ImageUploader';

type Object = {
  id: string;
  nom: string;
  type: string;
  utilisateur: string;
  status: 'disponible' | 'indisponible';
  photos: { url: string; description: string[] }[];
};

export default function EditObject() {
  const { id } = useParams();
  const router = useRouter();
  const [object, setObject] = useState<Object | null>(null);
  const [formData, setFormData] = useState<Omit<Object, 'id'>>({
    nom: '',
    type: '',
    utilisateur: '',
    status: 'disponible',
    photos: []
  });
  const [tempDescription, setTempDescription] = useState('');

  useEffect(() => {
    const fetchObject = async () => {
      try {
        const response = await fetch(`/api/objects/${id}`);
        if (response.ok) {
          const data = await response.json();
          setObject(data);
          setFormData({
            nom: data.nom,
            type: data.type,
            utilisateur: data.utilisateur,
            status: data.status,
            photos: data.photos || []
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l&apos;objet:', error);
      }
    };

    fetchObject();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (imageUrls: string[]) => {
    const newPhotos = imageUrls.map(url => ({ url, description: [] }));
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
  };

  const handlePhotoDescriptionChange = (photoIndex: number) => {
    if (tempDescription.trim()) {
      setFormData(prev => ({
        ...prev,
        photos: prev.photos.map((photo, index) => 
          index === photoIndex
            ? { ...photo, description: [...photo.description, tempDescription.trim()] }
            : photo
        )
      }));
      setTempDescription('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/objects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, id }),
      });

      if (response.ok) {
        router.push(`/objects/${id}`);
      } else {
        const error = await response.json();
        alert(`Erreur lors de la mise à jour : ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour de l&apos;objet');
    }
  };

  if (!object) {
    return (
      <div role="alert" className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="sr-only">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête fixe */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Modifier l&apos;objet : {object.nom}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Modifiez les informations de l&apos;objet
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href={`/objects/${id}`}
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
                Informations générales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                    Nom
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <input
                    type="text"
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
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
                  >
                    <option value="disponible">Disponible</option>
                    <option value="indisponible">Indisponible</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section photos */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Photos
              </h2>
              <div className="space-y-6">
                <ImageUploader onUpload={handleImageUpload} type="object" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {formData.photos.map((photo, photoIndex) => (
                    <div key={photoIndex} className="bg-gray-50 rounded-lg p-4">
                      <img
                        src={photo.url}
                        alt={`Photo ${photoIndex + 1}`}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={tempDescription}
                            onChange={(e) => setTempDescription(e.target.value)}
                            placeholder="Ajouter une description"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handlePhotoDescriptionChange(photoIndex)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Ajouter
                          </button>
                        </div>
                        {photo.description.map((desc, descIndex) => (
                          <p key={descIndex} className="text-sm text-gray-600 bg-white p-2 rounded">
                            {desc}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bouton de soumission */}
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
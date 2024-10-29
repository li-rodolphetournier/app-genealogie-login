'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import ImageUploader from '../../../components/ImageUploader';
import usersData from '../../../data/users.json';

type User = {
  login: string;
  password: string;
  email: string;
  description: string;
  profileImage: string;
  status: string;
};

type Photo = {
  url: string;
  description: string[];
};

const CreateObject = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    nom: '',
    type: '',
    utilisateur: '',
    status: 'disponible',
    photos: [] as Photo[],
  });
  const [tempDescription, setTempDescription] = useState('');

  useEffect(() => {
    setUsers(usersData);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageUpload = (imageUrls: string[]) => {
    const newPhotos = imageUrls.map(url => ({ url, description: [] }));
    setFormData(prevData => ({
      ...prevData,
      photos: [...prevData.photos, ...newPhotos],
    }));
  };

  const handlePhotoDescriptionChange = (index: number) => {
    if (tempDescription.trim() !== '') {
      setFormData(prevData => ({
        ...prevData,
        photos: prevData.photos.map((photo, i) => 
          i === index ? { ...photo, description: [...photo.description, tempDescription.trim()] } : photo
        ),
      }));
      setTempDescription('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/objects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Objet créé avec succès:', data);
        router.push('/objects');
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          console.error('Erreur lors de l\'ajout de l\'objet:', errorData);
          alert(`Erreur lors de l'ajout de l'objet: ${JSON.stringify(errorData)}`);
        } else {
          const text = await response.text();
          console.error('Réponse inattendue du serveur:', text);
          alert(`Réponse inattendue du serveur: ${text.substring(0, 200)}...`);
        }
      }
    } catch (error) {
      console.error('Erreur réseau lors de l\'ajout de l\'objet:', error);
      alert(`Une erreur réseau est survenue lors de l'ajout de l'objet: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Créer un nouvel objet</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nom" className="block">Nom:</label>
          <input
            type="text"
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label htmlFor="type" className="block">Type:</label>
          <input
            type="text"
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label htmlFor="utilisateur" className="block">Utilisateur:</label>
          <select
            id="utilisateur"
            name="utilisateur"
            value={formData.utilisateur}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          >
            <option value="">Sélectionnez un utilisateur</option>
            {users.map(user => (
              <option key={user.login} value={user.login}>{user.login}</option>
            ))}
          </select>
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
            <option value="disponible">Disponible</option>
            <option value="indisponible">Indisponible</option>
          </select>
        </div>
        <div>
          <label className="block">Photos:</label>
          <ImageUploader onUpload={handleImageUpload} type="object" />
          {formData.photos.length > 0 && (
            <div className="mt-2">
              {formData.photos.map((photo, index) => (
                <div key={`photo-${index}`} className="mb-2">
                  <img src={photo.url} alt={`Uploaded ${index + 1}`} className="w-24 h-24 object-cover inline-block mr-2" />
                  <input
                    type="text"
                    placeholder="Description de la photo"
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    className="border rounded p-2"
                  />
                  <button
                    type="button"
                    onClick={() => handlePhotoDescriptionChange(index)}
                    className="ml-2 bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Ajouter description
                  </button>
                  {photo.description.length > 0 && (
                    <ul className="mt-2">
                      {photo.description.map((desc, descIndex) => (
                        <li key={descIndex}>{desc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-between">
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Créer l&apos;objet
          </button>
          <Link href="/objects" className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
            Annuler
          </Link>
        </div>
      </form>
    </Layout>
  );
};

export default CreateObject;

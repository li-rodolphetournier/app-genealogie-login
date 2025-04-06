'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { ObjectData, Photo } from '../../../types/objects';

import Image from 'next/image';
import LoadingIndicator from '../../../share-components/LoadingIndicator';
import { User } from '../../../types/user';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 Mo

interface PageProps {
  params: Promise<{ objectId: string }>;
}

export default function EditObject() {
  const router = useRouter();
  const params = useParams();
  const objectId = params?.objectId as string | undefined;

  const [object, setObject] = useState<ObjectData | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    } else {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (objectId) {
      const fetchObject = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/objects/${objectId}`);
          if (response.ok) {
            const data = await response.json();
            setObject(data);
            setPreviews(data.photos?.map((p: { url: string }) => p.url) || []);
          } else {
            setError('Impossible de charger l\'objet');
          }
        } catch (err) {
          setError('Erreur de connexion');
        } finally {
          setIsLoading(false);
        }
      };
      void fetchObject();
    }
  }, [objectId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewImages(filesArray);

      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      const existingValidPreviews = previews.filter(url => !removedPhotos.includes(url) && !url.startsWith('blob:'));
      setPreviews([...existingValidPreviews, ...newPreviews]);
    }
  };

  const handleRemoveExistingPhoto = (urlToRemove: string) => {
    setRemovedPhotos((prev: string[]) => [...prev, urlToRemove]);
    setPreviews((prev: string[]) => prev.filter(url => url !== urlToRemove));
  };

  const handleRemoveNewPhoto = (indexToRemove: number, previewUrl: string) => {
    setNewImages((prev: File[]) => prev.filter((_, index) => index !== indexToRemove));
    setPreviews((prev: string[]) => prev.filter(url => url !== previewUrl));
    URL.revokeObjectURL(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!object || !user) return;

    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('id', object.id);
      formData.append('nom', object.nom);
      formData.append('type', object.type);
      formData.append('description', object.description || '');
      formData.append('longDescription', object.longDescription || '');
      formData.append('status', object.status);
      formData.append('utilisateur', object.utilisateur);

      const existingPhotos = object.photos?.filter((p: Photo) => !removedPhotos.includes(p.url)).map((p: Photo) => JSON.stringify(p)) || [];
      existingPhotos.forEach((photo: string) => formData.append('existingPhotosJson', photo));

      newImages.forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`Le fichier ${file.name} dépasse la taille maximale de 2 Mo.`);
        }
        formData.append('newPhotos', file);
      });

      const response = await fetch(`/api/objects/${object.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la mise à jour de l\'objet');
      }

      router.push(`/objects/${object.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingIndicator text="Chargement de l'objet à modifier..." />;
  }
  if (error) return <div className="text-red-500">{error}</div>;
  if (!object) return <div>Objet non trouvé</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setObject((prev: ObjectData | null) => (prev ? { ...prev, [name]: value } : null));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-bold mb-6">Modifier l'objet : {object.nom}</h1>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  type="text"
                  name="nom"
                  id="nom"
                  value={object.nom}
                  onChange={handleChange}
                  className="mt-1 block w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <input
                  type="text"
                  name="type"
                  id="type"
                  value={object.type}
                  onChange={handleChange}
                  className="mt-1 block w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Statut
                </label>
                <select
                  name="status"
                  id="status"
                  value={object.status}
                  onChange={handleChange}
                  className="mt-1 block w-full"
                  required
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="publie">Publié</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description Courte
                </label>
                <textarea
                  name="description"
                  id="description"
                  value={object.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="longDescription" className="block text-sm font-medium text-gray-700">
                  Description Longue (Détails)
                </label>
                <textarea
                  name="longDescription"
                  id="longDescription"
                  value={object.longDescription || ''}
                  onChange={handleChange}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Description détaillée de l'objet..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos
                </label>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {previews.map((previewUrl, index) => (
                    <div key={previewUrl} className="relative group">
                      <Image
                        src={previewUrl}
                        alt={`Aperçu ${index + 1}`}
                        width={200}
                        height={200}
                        className="object-cover rounded aspect-square"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const isExisting = object.photos?.some((p: Photo) => p.url === previewUrl);
                          if (isExisting) {
                            handleRemoveExistingPhoto(previewUrl);
                          } else {
                            const originalFileIndex = newImages.findIndex(file => URL.createObjectURL(file) === previewUrl);
                            if (originalFileIndex !== -1) {
                              handleRemoveNewPhoto(originalFileIndex, previewUrl);
                            } else {
                              console.warn('Could not find original file index for preview:', previewUrl);
                            }
                          }
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Supprimer l'image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push(`/objects/${objectId}`)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  disabled={isSaving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={isSaving}
                >
                  {isSaving && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ObjectData } from '@/types/objects';
import Image from 'next/image';

interface PageProps {
  params: Promise<{ objectId: string }>;
}

export default function EditObject({ params }: PageProps) {
  const { objectId } = use(params);
  const router = useRouter();
  const [object, setObject] = useState<ObjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImageDescriptions, setNewImageDescriptions] = useState<string[]>([]);

  useEffect(() => {
    if (objectId) {
      void fetchObject();
    }
  }, [objectId]);

  const fetchObject = async () => {
    try {
      const response = await fetch(`/api/objects/${objectId}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'objet');
      }
      const data = await response.json();
      setObject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('photos', file);
    });

    try {
      const response = await fetch(`/api/objects/${objectId}/photos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement des images');
      }

      const data = await response.json();
      setObject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          photos: [...(prev.photos || []), ...data.photos]
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléchargement');
    }
  };

  const handleRemoveImage = async (photoIndex: number) => {
    if (!object?.photos) return;

    try {
      const response = await fetch(`/api/objects/${objectId}/photos?photoIndex=${photoIndex}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'image');
      }

      const result = await response.json();
      
      if (result.message === 'Photo supprimée avec succès') {
        setObject(prev => {
          if (!prev || !prev.photos) return prev;
          const newPhotos = [...prev.photos];
          newPhotos.splice(photoIndex, 1);
          return { ...prev, photos: newPhotos };
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleUpdateImageDescription = (index: number, description: string) => {
    if (!object?.photos) return;

    setObject(prev => {
      if (!prev || !prev.photos) return prev;
      const newPhotos = [...prev.photos];
      newPhotos[index] = {
        ...newPhotos[index],
        description: [description]
      };
      return { ...prev, photos: newPhotos };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/objects/${objectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(object),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'objet');
      }

      router.push(`/objects/${objectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!object) return <div>Objet non trouvé</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-bold mb-6">Modifier l&apos;objet</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <input
                  type="text"
                  id="nom"
                  value={object.nom}
                  onChange={(e) => setObject({ ...object, nom: e.target.value })}
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
                  id="type"
                  value={object.type}
                  onChange={(e) => setObject({ ...object, type: e.target.value })}
                  className="mt-1 block w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Statut
                </label>
                <select
                  id="status"
                  value={object.status}
                  onChange={(e) => setObject({ ...object, status: e.target.value as 'brouillon' | 'publie' })}
                  className="mt-1 block w-full"
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="publie">Publié</option>
                </select>
              </div>

              {/* Section des images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {object.photos?.map((photo, index) => (
                    <div key={index} className="relative border rounded p-4">
                      <div className="relative h-48 mb-2">
                        <Image
                          src={photo.url}
                          alt={photo.description?.[0] || ''}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <input
                        type="text"
                        value={photo.description?.[0] || ''}
                        onChange={(e) => handleUpdateImageDescription(index, e.target.value)}
                        className="w-full mb-2"
                        placeholder="Description"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
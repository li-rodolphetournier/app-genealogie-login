'use client';

import type { ObjectData, ObjectPhoto } from '@/types/objects';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

import Image from 'next/image';
import LoadingIndicator from '@/components/LoadingIndicator';
import { PageTransition } from '@/components/animations';
import { FileUploader } from '@/components/file-uploader';
import type { User } from '@/types/user';

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
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États pour la gestion des catégories
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const { user } = useAuth({
    redirectIfUnauthenticated: true,
    redirectTo: '/',
  });

  // Charger les catégories et l'objet
  useEffect(() => {
    const loadData = async () => {
      if (!objectId) return;
      
      setIsLoading(true);
      try {
        // Charger les catégories et l'objet en parallèle
        const [categoriesResponse, objectResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch(`/api/objects/${objectId}`)
        ]);

        // Traiter les catégories
        let loadedCategories: string[] = [];
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          // Extraire les noms des catégories
          loadedCategories = (categoriesData.categories || []).map((cat: any) => cat.name || cat);
        }
          
        // Traiter l'objet
        if (objectResponse.ok) {
          const objectData = await objectResponse.json();
          
          // S'assurer que la catégorie de l'objet est dans la liste
          if (objectData.type && !loadedCategories.includes(objectData.type)) {
            loadedCategories = [...loadedCategories, objectData.type].sort();
          }
          
          setObject(objectData);
          setPreviews(objectData.photos?.map((p: { url: string }) => p.url) || []);
          
          // S'assurer que utilisateur est défini (login, pas UUID)
        } else {
          setError('Impossible de charger l\'objet');
        }
        
        // Mettre à jour les catégories après avoir vérifié l'objet
        setCategories(loadedCategories);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Erreur de connexion');
      } finally {
        setIsLoading(false);
      }
    };
    
    void loadData();
  }, [objectId]);

  const handleFileSelect = (files: File[]) => {
    setNewImages(files);
    // Créer des previews temporaires pour les nouveaux fichiers
    const newPreviews = files.map(file => URL.createObjectURL(file));
    const existingValidPreviews = previews.filter(url => !removedPhotos.includes(url) && !url.startsWith('blob:'));
    setPreviews([...existingValidPreviews, ...newPreviews]);
  };

  const handleUploadComplete = (urls: string[]) => {
    setNewImageUrls(urls);
    // Remplacer les previews blob par les URLs réelles
    setPreviews((prev) => {
      const blobPreviews = prev.filter(url => url.startsWith('blob:'));
      const nonBlobPreviews = prev.filter(url => !url.startsWith('blob:') && !removedPhotos.includes(url));
      return [...nonBlobPreviews, ...urls];
    });
  };

  const handleRemoveExistingPhoto = (urlToRemove: string) => {
    setRemovedPhotos((prev: string[]) => [...prev, urlToRemove]);
    setPreviews((prev: string[]) => prev.filter(url => url !== urlToRemove));
  };

  const handleRemoveNewPhoto = (indexToRemove: number, previewUrl: string) => {
    setNewImages((prev: File[]) => prev.filter((_, index) => index !== indexToRemove));
    setNewImageUrls((prev: string[]) => prev.filter(url => url !== previewUrl));
    setPreviews((prev: string[]) => {
      const filtered = prev.filter(url => url !== previewUrl);
      // Nettoyer les URLs blob si nécessaire
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      return filtered;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!object || !user) return;

    setIsSaving(true);
    setError(null);

    try {
      // Utiliser les URLs déjà uploadées si disponibles, sinon uploader les fichiers
      let newPhotoUrls: string[] = [];
      if (newImageUrls.length > 0) {
        // Les images ont déjà été uploadées via le FileUploader
        newPhotoUrls = newImageUrls;
      } else if (newImages.length > 0) {
        // Fallback: uploader les fichiers si les URLs ne sont pas encore disponibles
        for (const file of newImages) {
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`Le fichier ${file.name} dépasse la taille maximale de 2 Mo.`);
          }
          
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          uploadFormData.append('folder', 'objects');
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            // L'API retourne imageUrl ou publicUrl
            const imageUrl = uploadData.imageUrl || uploadData.url || uploadData.publicUrl;
            if (!imageUrl) {
              throw new Error(`Réponse d'upload invalide pour ${file.name}`);
            }
            newPhotoUrls.push(imageUrl);
          } else {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Erreur lors de l'upload de ${file.name}`);
          }
        }
      }

      // Préparer les photos existantes (en excluant celles supprimées)
      const existingPhotos = object.photos
        ?.filter((p: ObjectPhoto) => !removedPhotos.includes(p.url))
        .map((p: ObjectPhoto) => ({
          url: p.url,
          description: p.description || [],
          display_order: p.display_order || 0,
        })) || [];

      // Ajouter les nouvelles photos
      const allPhotos = [
        ...existingPhotos,
        ...newPhotoUrls.map((url, index) => ({
          url,
          description: [] as string[], // S'assurer que c'est un tableau de strings
          display_order: existingPhotos.length + index,
        })),
      ];

      // Préparer les données JSON pour l'API
      // S'assurer que utilisateur est toujours une string (login) et non un ID
      // Utiliser user.login comme fallback si object.utilisateur est vide ou absent
      let utilisateurLogin = '';
      if (typeof object.utilisateur === 'string' && object.utilisateur.trim() !== '') {
        utilisateurLogin = object.utilisateur.trim();
      } else if (user?.login) {
        // Fallback sur l'utilisateur actuel si l'objet n'a pas de utilisateur défini
        utilisateurLogin = user.login;
      } else {
        throw new Error('Impossible de déterminer l\'utilisateur pour cet objet');
      }

      const updateData = {
        nom: object.nom,
        type: object.type,
        description: object.description || undefined,
        longDescription: object.longDescription || undefined,
        status: object.status,
        utilisateur: utilisateurLogin, // Toujours présent et non vide maintenant
        photos: allPhotos,
      };

      const response = await fetch(`/api/objects/${object.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Erreur lors de la mise à jour de l\'objet');
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
  if (error) return <div className="text-red-500 dark:text-red-400">{error}</div>;
  if (!object) return <div className="text-gray-900 dark:text-white">Objet non trouvé</div>;

  // Fonction pour créer une nouvelle catégorie
  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      setError('Le nom de la catégorie ne peut pas être vide');
      return;
    }

    if (categories.includes(newCategory.trim())) {
      setError('Cette catégorie existe déjà');
      return;
    }

    setIsCreatingCategory(true);
    setError(null);

    try {
      // Appeler l'API pour créer la catégorie
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.trim(),
          description: '',
        }),
      });

      if (response.ok) {
        // Ajouter la nouvelle catégorie à la liste
        const updatedCategories = [...categories, newCategory.trim()].sort();
        setCategories(updatedCategories);
        
        // Mettre à jour l'objet avec la nouvelle catégorie
        setObject((prev: ObjectData | null) => 
          prev ? { ...prev, type: newCategory.trim() } : null
        );
        
        // Réinitialiser le formulaire de création
        setNewCategory('');
        setShowNewCategoryInput(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Erreur lors de la création de la catégorie');
      }
    } catch (err) {
      setError('Erreur de connexion lors de la création de la catégorie');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setObject((prev: ObjectData | null) => (prev ? { ...prev, [name]: value } : null));
    if (name === 'type') {
      setShowNewCategoryInput(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Modifier l'objet : {object.nom}</h1>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 mb-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie
                </label>
                
                {/* Dropdown pour sélectionner une catégorie existante */}
                <select
                  name="type"
                  id="type"
                  value={object.type || ''}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  <option value="">-- Sélectionner une catégorie --</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  {/* Si la catégorie de l'objet n'est pas dans la liste, l'ajouter quand même */}
                  {object.type && !categories.includes(object.type) && (
                    <option value={object.type}>
                      {object.type}
                    </option>
                  )}
                </select>
                
                {/* Message si aucune catégorie n'est disponible */}
                {categories.length === 0 && !object.type && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Aucune catégorie disponible. Créez-en une nouvelle ci-dessous.
                  </p>
                )}

                {/* Option pour créer une nouvelle catégorie */}
                {!showNewCategoryInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryInput(true);
                    }}
                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                  >
                    + Créer une nouvelle catégorie
                  </button>
                ) : (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                    <label htmlFor="newCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nouvelle catégorie
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="newCategory"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateCategory();
                          }
                        }}
                        placeholder="Nom de la nouvelle catégorie"
                        className="flex-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={isCreatingCategory || !newCategory.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isCreatingCategory ? 'Ajout...' : 'Valider'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategory('');
                          setError(null);
                        }}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Statut
                </label>
                <select
                  name="status"
                  id="status"
                  value={object.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  required
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="publie">Publié</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description Courte
                </label>
                <textarea
                  name="description"
                  id="description"
                  value={object.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              <div>
                <label htmlFor="longDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description Longue (Détails)
                </label>
                <textarea
                  name="longDescription"
                  id="longDescription"
                  value={object.longDescription || ''}
                  onChange={handleChange}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Description détaillée de l'objet..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="object-cover rounded aspect-square border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const isExisting = object.photos?.some((p: ObjectPhoto) => p.url === previewUrl);
                          if (isExisting) {
                            handleRemoveExistingPhoto(previewUrl);
                          } else {
                            // Vérifier si c'est une URL uploadée
                            const urlIndex = newImageUrls.findIndex(url => url === previewUrl);
                            if (urlIndex !== -1) {
                              handleRemoveNewPhoto(urlIndex, previewUrl);
                            } else {
                              // Sinon, c'est un fichier local avec blob URL
                              const originalFileIndex = newImages.findIndex((file, index) => {
                                const blobUrl = URL.createObjectURL(file);
                                const existingBlob = previews.find(p => p.startsWith('blob:') && p !== previewUrl);
                                return previewUrl.startsWith('blob:') && index < newImages.length;
                              });
                              if (originalFileIndex !== -1) {
                                handleRemoveNewPhoto(originalFileIndex, previewUrl);
                              } else {
                                // Fallback: chercher par index dans previews
                                const previewIndex = previews.findIndex(p => p === previewUrl);
                                if (previewIndex !== -1 && previewIndex < newImages.length) {
                                  handleRemoveNewPhoto(previewIndex, previewUrl);
                                }
                              }
                            }
                          }
                        }}
                        className="absolute top-1 right-1 bg-red-600 dark:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 dark:hover:bg-red-600"
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
                  <FileUploader
                    onFileSelect={handleFileSelect}
                    onUploadComplete={handleUploadComplete}
                    onError={(errorMessage) => setError(errorMessage)}
                    folder="objects"
                    maxFileSizeMB={2}
                    multiple={true}
                    accept="image/*"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Formats acceptés : JPG, PNG, GIF (max 2 Mo par fichier)
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => router.push(`/objects/${objectId}`)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
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
    </PageTransition>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/animations';
import { FileUploader } from '@/components/file-uploader';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // Taille maximale de fichier en octets (2 Mo)

export default function CreateObject() {
  const router = useRouter();
  const { user, isLoading } = useAuth({
    redirectIfUnauthenticated: true,
    redirectTo: '/',
  });
  
  const [nom, setNom] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState<'brouillon' | 'publie'>('brouillon');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // États pour la gestion des catégories
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // Charger les catégories au montage du composant
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          // Extraire les noms des catégories
          const categoryNames = (data.categories || []).map((cat: any) => cat.name || cat);
          setCategories(categoryNames);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des catégories:', err);
      }
    };
    
    loadCategories();
  }, []);

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
        
        // Sélectionner automatiquement la nouvelle catégorie
        setType(newCategory.trim());
        
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

  if (isLoading || !user) {
    return (
      <main role="main" className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Créer un nouvel objet</h1>
          <div>Chargement...</div>
        </div>
      </main>
    );
  }

  // Vérifier que l'utilisateur est administrateur ou rédacteur
  if (user.status !== 'administrateur' && user.status !== 'redacteur') {
    return (
      <PageTransition>
        <main role="main" className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Accès refusé
              </h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Seuls les administrateurs ou rédacteurs peuvent créer des objets.
              </p>
              <button
                onClick={() => router.push('/objects')}
                className="mt-6 inline-block px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
              >
                Retour à la liste
              </button>
            </div>
          </div>
        </main>
      </PageTransition>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setError('Vous devez être connecté pour créer un objet');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nom', nom);
      formData.append('type', type);
      formData.append('status', status);
      formData.append('utilisateur', user.login);
      formData.append('description', description);
      formData.append('longDescription', longDescription);

      // Ajouter les photos si présentes
      for (const photo of photos) {
        if (photo.size > MAX_FILE_SIZE) {
          setError('L\'image est trop grosse. La taille maximale autorisée est de 2 Mo.');
          return;
        }
        formData.append('photos', photo);
      }

      // Convertir FormData en JSON car l'API attend du JSON
      const objectData: any = {
        nom,
        type,
        status,
        utilisateur: user.login,
        description,
        longDescription,
      };

      // Utiliser les URLs déjà uploadées si disponibles, sinon uploader les fichiers
      if (photoUrls.length > 0) {
        // Le schéma attend description comme tableau de strings
        objectData.photos = photoUrls.map((url, index) => ({ 
          url, 
          description: [] as string[],
          display_order: index 
        }));
      } else if (photos.length > 0) {
        // Fallback: uploader les fichiers si les URLs ne sont pas encore disponibles
        const uploadedUrls: string[] = [];
        for (const photo of photos) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', photo);
          uploadFormData.append('folder', 'objects');
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            // L'API retourne imageUrl ou publicUrl
            const imageUrl = uploadData.imageUrl || uploadData.url || uploadData.publicUrl;
            if (imageUrl) {
              uploadedUrls.push(imageUrl);
            }
          } else {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Erreur lors de l'upload de ${photo.name}`);
          }
        }
        // Le schéma attend description comme tableau de strings
        objectData.photos = uploadedUrls.map((url, index) => ({ 
          url, 
          description: [] as string[],
          display_order: index 
        }));
      }

      const response = await fetch('/api/objects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(objectData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la création de l\'objet');
      }

      router.push('/objects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleFileSelect = (files: File[]) => {
    setPhotos(files);
  };

  const handleUploadComplete = (urls: string[]) => {
    setPhotoUrls(urls);
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <PageTransition>
      <main role="main" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Créer un nouvel objet</h1>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 mb-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom de l'objet
                </label>
                <input
                  type="text"
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  className="mt-1 block w-full"
                  placeholder="Saisissez le nom de l'objet"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie
                </label>
                
                {/* Dropdown pour sélectionner une catégorie existante */}
                <select
                  id="type"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setShowNewCategoryInput(false);
                    setError(null);
                  }}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  <option value="">-- Sélectionner une catégorie --</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                {/* Option pour créer une nouvelle catégorie */}
                {!showNewCategoryInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryInput(true);
                      setType('');
                    }}
                    className="mt-2 text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 underline font-medium bg-transparent"
                  >
                    + Créer une nouvelle catégorie
                  </button>
                ) : (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
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
                        className="flex-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={isCreatingCategory || !newCategory.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
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
                  État de publication
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'brouillon' | 'publie')}
                  className="mt-1 block w-full"
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="publie">Publié</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Photos
                </label>
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
                {photoUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photoUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Aperçu ${index + 1}`}
                          className="h-32 w-full object-cover rounded-md border border-gray-300"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description Courte
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Description brève de l'objet"
                />
              </div>

              <div>
                <label htmlFor="longDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description Longue (Détails)
                </label>
                <textarea
                  id="longDescription"
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Description détaillée de l'objet..."
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/objects')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800"
                >
                  Créer l'objet
                </button>
              </div>
            </div>
          </form>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}

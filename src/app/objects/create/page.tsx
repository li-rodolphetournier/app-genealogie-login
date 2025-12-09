'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

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
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
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
    return <div>Chargement...</div>;
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

      // Pour les photos, il faudra les uploader séparément via /api/upload
      // puis ajouter les URLs aux données de l'objet
      if (photos.length > 0) {
        const photoUrls: string[] = [];
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
              photoUrls.push(imageUrl);
            }
          } else {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Erreur lors de l'upload de ${photo.name}`);
          }
        }
        // Le schéma attend description comme tableau de strings
        objectData.photos = photoUrls.map((url, index) => ({ 
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
        throw new Error('Erreur lors de la création de l\'objet');
      }

      router.push('/objects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      setPhotos(Array.from(e.target.files));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      if (file) {
        reader.readAsDataURL(file);
      }
    }
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h1 className="text-2xl font-bold mb-6">Créer un nouvel objet</h1>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
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
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    + Créer une nouvelle catégorie
                  </button>
                ) : (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <label htmlFor="newCategory" className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
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
                <label className="block text-sm font-medium text-gray-700">
                  Photos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  lang="fr"
                  aria-label="Sélectionner des photos"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-1 block w-full text-sm text-gray-500
                    cursor-pointer
                    border border-gray-300 rounded-md
                    py-2 px-4 flex items-center justify-center
                    hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Cliquez pour ajouter des photos"
                  aria-labelledby="file-upload-label"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5V21h18v-4.5M3 12l9-9 9 9M12 3v15" />
                  </svg>
                  <span id="file-upload-label">Cliquez pour ajouter des photos</span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Formats acceptés : JPG, PNG, GIF
                </p>
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Aperçu" className="h-32 w-auto rounded-md" />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description Courte
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Description brève de l'objet"
                />
              </div>

              <div>
                <label htmlFor="longDescription" className="block text-sm font-medium text-gray-700">
                  Description Longue (Détails)
                </label>
                <textarea
                  id="longDescription"
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Description détaillée de l'objet..."
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/objects')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Créer l'objet
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

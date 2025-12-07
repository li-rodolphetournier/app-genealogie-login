'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ObjectCard } from '@/components/cards/ObjectCard';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ToastProvider';
import { getErrorMessage } from '@/lib/errors/messages';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import ImageWithFallback from '@/components/ImageWithFallback'; // Utilisé dans la vue liste
import type { ObjectData } from '@/types/objects';

type FilterType = 'tous' | 'nom' | 'utilisateur' | 'status';
type SortType = 'nom' | 'type' | 'utilisateur' | 'status';
type SortDirection = 'asc' | 'desc';

type ObjectsClientProps = {
  initialObjects: ObjectData[];
};

export function ObjectsClient({ initialObjects }: ObjectsClientProps) {
  const { showToast } = useToast();
  const [objects] = useState<ObjectData[]>(initialObjects);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<FilterType>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<SortType>('nom');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [userStatus, setUserStatus] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [objectToDelete, setObjectToDelete] = useState<string | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('tous');
  
  // Récupérer le statut utilisateur via useAuth
  const { user } = useAuth();
  useEffect(() => {
    setUserStatus(user?.status || 'utilisateur');
  }, [user]);

  // Extraire les types disponibles
  const availableTypes = useMemo(() => {
    return [...new Set(objects.map(obj => obj.type))].sort();
  }, [objects]);

  // Filtrer et trier les objets
  const filteredObjects = useMemo(() => {
    let result = [...objects];

    // Filtre par statut utilisateur
    if (userStatus === 'utilisateur') {
      result = result.filter(obj => obj.status === 'publie');
    }

    // Filtre par type
    if (selectedTypeFilter !== 'tous') {
      result = result.filter(obj => obj.type === selectedTypeFilter);
    }

    // Recherche
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(object => {
        if (filterType === 'tous') {
          return (
            object.nom.toLowerCase().includes(searchTermLower) ||
            object.utilisateur.toLowerCase().includes(searchTermLower) ||
            object.status.toLowerCase().includes(searchTermLower) ||
            (object.description && object.description.toLowerCase().includes(searchTermLower)) ||
            (object.longDescription && object.longDescription.toLowerCase().includes(searchTermLower))
          );
        } else {
          switch (filterType) {
            case 'nom':
              return object.nom.toLowerCase().includes(searchTermLower);
            case 'utilisateur':
              return object.utilisateur.toLowerCase().includes(searchTermLower);
            case 'status':
              return object.status.toLowerCase().includes(searchTermLower);
            default:
              return true;
          }
        }
      });
    }

    // Tri
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortType) {
        case 'nom':
          comparison = a.nom.localeCompare(b.nom);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'utilisateur':
          comparison = a.utilisateur.localeCompare(b.utilisateur);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [objects, userStatus, selectedTypeFilter, searchTerm, filterType, sortType, sortDirection]);

  const toggleSortDirection = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const handleDelete = useCallback((id: string) => {
    setObjectToDelete(id);
    setIsModalOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!objectToDelete) return;

    try {
      const response = await fetch(`/api/objects/${objectToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        showToast(getErrorMessage('OBJECT_DELETE_FAILED'), 'error');
      }
    } catch (error) {
      console.error('Erreur réseau lors de la suppression:', error);
      showToast(getErrorMessage('NETWORK'), 'error');
    } finally {
      setIsModalOpen(false);
      setObjectToDelete(null);
    }
  };

  const renderActions = useCallback((object: ObjectData) => {
    if (userStatus === 'utilisateur') {
      return (
        <Link
          href={`/objects/${object.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Voir détails
        </Link>
      );
    }

    return (
      <div className="flex space-x-2">
        <Link
          href={`/objects/${object.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Voir détails
        </Link>
        <button
          onClick={() => handleDelete(object.id)}
          className="text-red-600 hover:text-red-800 font-medium text-sm"
          aria-label={`Supprimer ${object.nom}`}
        >
          Supprimer
        </button>
      </div>
    );
  }, [userStatus, handleDelete]);

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'publie':
        return 'Publié';
      case 'brouillon':
        return 'Brouillon';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm">
        <header className="w-full">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Liste des objets
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gérez et consultez tous les objets disponibles
                </p>
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/objects/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Créer un objet
                </Link>
                <Link
                  href="/accueil"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Retour à l&apos;accueil
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="w-full border-t border-gray-200">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full rounded-md border-2 border-gray-300 pl-4 pr-12 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Rechercher..."
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filtres {showFilters ? '(Masquer)' : '(Afficher)'}
                  </button>
                  <button
                    onClick={toggleSortDirection}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className={`h-5 w-5 mr-2 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    Trier ({sortType})
                  </button>
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {viewMode === 'grid' ? (
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    )}
                    {viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="filter-field" className="block text-sm font-medium text-gray-700 mb-1">
                        Champ de Recherche
                      </label>
                      <select
                        id="filter-field"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as FilterType)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="tous">Tous les champs</option>
                        <option value="nom">Nom</option>
                        <option value="utilisateur">Utilisateur</option>
                        <option value="status">Statut</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-1">
                        Filtrer par Type
                      </label>
                      <select
                        id="filter-type"
                        value={selectedTypeFilter}
                        onChange={(e) => setSelectedTypeFilter(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="tous">Tous les Types</option>
                        {availableTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="sort-field" className="block text-sm font-medium text-gray-700 mb-1">
                        Trier par
                      </label>
                      <select
                        id="sort-field"
                        value={sortType}
                        onChange={(e) => setSortType(e.target.value as SortType)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="nom">Nom</option>
                        <option value="type">Type</option>
                        <option value="utilisateur">Utilisateur</option>
                        <option value="status">Statut</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 pt-2">
                {filteredObjects.length} objet{filteredObjects.length !== 1 ? 's' : ''} trouvé{filteredObjects.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="pt-[210px] pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full mx-auto">
          {filteredObjects.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Aucun objet ne correspond aux filtres sélectionnés.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {filteredObjects.map((object) => (
                  <ObjectCard
                    key={object.id}
                    object={object}
                    onDelete={userStatus !== 'utilisateur' ? handleDelete : undefined}
                    canEdit={userStatus !== 'utilisateur'}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {filteredObjects.map((object) => (
                  <li key={object.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <Link href={`/objects/${object.id}`} className="flex-shrink-0 w-16 h-16 block">
                        <ImageWithFallback
                          src={object.photos?.[0]?.url}
                          alt={object.photos?.[0]?.description?.[0] || `Photo de ${object.nom}`}
                          className="w-16 h-16 rounded"
                          imgClassName="object-cover rounded"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {object.nom}
                        </p>
                        <p className="text-sm text-gray-500">
                          Type: {object.type}
                        </p>
                        <p className="text-sm text-gray-500">
                          Par: {object.utilisateur}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            object.status === 'publie' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {getStatusLabel(object.status)}
                        </span>
                        {renderActions(object)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setObjectToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}


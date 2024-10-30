'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Object = {
  id: string;
  nom: string;
  type: string;
  utilisateur: string;
  status: 'disponible' | 'indisponible';
  photos: { url: string; description: string[] }[];
};

type FilterType = 'tous' | 'nom' | 'type' | 'utilisateur' | 'status';
type SortType = 'nom' | 'type' | 'utilisateur' | 'status';
type SortDirection = 'asc' | 'desc';

export default function ObjectsList() {
  const [objects, setObjects] = useState<Object[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<Object[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<FilterType>('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<SortType>('nom');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [userStatus, setUserStatus] = useState<string>('');

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const response = await fetch('/api/objects');
        if (response.ok) {
          const data = await response.json();
          setObjects(data);
          setFilteredObjects(data);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchObjects();
  }, []);

  useEffect(() => {
    const filtered = filterObjects();
    const sorted = sortObjects(filtered);
    setFilteredObjects(sorted);
  }, [filterType, searchTerm, objects, sortType, sortDirection]);

  const filterObjects = () => {
    if (!searchTerm.trim() || filterType === 'tous') {
      return objects;
    }

    const searchTermLower = searchTerm.toLowerCase();
    return objects.filter(object => {
      switch (filterType) {
        case 'nom':
          return object.nom.toLowerCase().includes(searchTermLower);
        case 'type':
          return object.type.toLowerCase().includes(searchTermLower);
        case 'utilisateur':
          return object.utilisateur.toLowerCase().includes(searchTermLower);
        case 'status':
          return object.status.toLowerCase().includes(searchTermLower);
        default:
          return true;
      }
    });
  };

  const sortObjects = (objectsToSort: Object[]) => {
    return [...objectsToSort].sort((a, b) => {
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
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet objet ?')) {
      try {
        const response = await fetch(`/api/objects/delete?id=${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setObjects(objects.filter(obj => obj.id !== id));
        } else {
          console.error('Erreur lors de la suppression de l&apos;objet');
        }
      } catch (error) {
        console.error('Erreur réseau lors de la suppression:', error);
      }
    }
  };

  useEffect(() => {
    // Récupérer le statut de l'utilisateur depuis le localStorage
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const { status } = JSON.parse(currentUser);
      setUserStatus(status);
    }
  }, []);

  const renderActions = (object: Object) => {
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
  };

  if (isLoading) {
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

      {/* Barre de filtrage et tri */}
      <div className="fixed top-20 left-0 right-0 bg-white shadow-sm z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col space-y-4">
            {/* Première ligne : Recherche et boutons */}
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
                  Filtres
                </button>
                <button
                  onClick={toggleSortDirection}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className={`h-5 w-5 mr-2 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  Trier
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

            {/* Panneau de filtres et tri */}
            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filtrer par
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as FilterType)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="tous">Tous</option>
                      <option value="nom">Nom</option>
                      <option value="type">Type</option>
                      <option value="utilisateur">Utilisateur</option>
                      <option value="status">Statut</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trier par
                    </label>
                    <select
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

            {/* Affichage du nombre de résultats */}
            <div className="text-sm text-gray-500">
              {filteredObjects.length} objet{filteredObjects.length !== 1 ? 's' : ''} trouvé{filteredObjects.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal - ajuster le padding-top */}
      <main className="pt-48 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-full mx-auto">
          {viewMode === 'grid' ? (
            // Vue grille
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {filteredObjects.map((object) => (
                  <div
                    key={object.id}
                    className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="aspect-w-16 aspect-h-9">
                      {object.photos && object.photos.length > 0 ? (
                        <img
                          src={object.photos[0].url}
                          alt={object.photos[0].description?.[0] || `Photo de ${object.nom}`}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        {object.nom}
                      </h2>
                      <p className="text-sm text-gray-600 mb-2">
                        Type: {object.type}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        Par: {object.utilisateur}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${object.status === 'disponible'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {object.status}
                        </span>
                        {renderActions(object)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Vue liste
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {filteredObjects.map((object) => (
                  <li key={object.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-16 h-16">
                        {object.photos && object.photos.length > 0 ? (
                          <img
                            src={object.photos[0].url}
                            alt={object.photos[0].description?.[0] || `Photo de ${object.nom}`}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${object.status === 'disponible'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {object.status}
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
    </div>
  );
}

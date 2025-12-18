'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ToastProvider';
import { BackToHomeButton } from '@/components/navigation';
import { PageTransition } from '@/components/animations';
import { motion } from 'framer-motion';

type Person = {
  id: string;
  nom: string;
  prenom: string;
};

type PositionHistoryItem = {
  id: string;
  personId: string | null; // Peut être null si la personne a été supprimée
  x: number;
  y: number;
  action: 'created' | 'updated' | 'deleted' | 'person_deleted';
  updatedAt: string;
  updatedBy: {
    id: string;
    login: string;
    email: string;
  } | null;
};

type ObjectHistoryItem = {
  id: string;
  objectId: string | null; // Peut être null si l'objet a été supprimé
  action: 'created' | 'updated' | 'deleted';
  updatedAt: string;
  updatedBy: {
    id: string;
    login: string;
    email: string;
  } | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields: string[];
};

type HistoriqueClientProps = {
  initialPersons: Person[];
};

export function HistoriqueClient({ initialPersons }: HistoriqueClientProps) {
  const { user } = useAuth({
    redirectIfUnauthenticated: true,
    redirectTo: '/',
  });

  const { showToast } = useToast();
  const [positionHistory, setPositionHistory] = useState<PositionHistoryItem[]>([]);
  const [objectHistory, setObjectHistory] = useState<ObjectHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'objects'>('positions');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<'all' | 'created' | 'updated' | 'deleted' | 'person_deleted'>('all');

  // Tous les hooks doivent être appelés avant tout return conditionnel
  useEffect(() => {
    // Ne charger l'historique que si l'utilisateur est admin
    if (user?.status !== 'administrateur') {
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      try {
        // Charger l'historique des positions
        let positionsUrl = '/api/genealogie/positions/history';
        if (selectedPersonId) {
          positionsUrl += `?person_id=${selectedPersonId}`;
        }
        const positionsResponse = await fetch(positionsUrl);
        const positionsData = await positionsResponse.json();
        
        if (positionsResponse.ok) {
          setPositionHistory(positionsData);
        } else {
          const errorMessage = positionsData.error || 'Erreur lors du chargement de l\'historique des positions';
          console.error('Erreur API positions:', errorMessage);
          if (errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
            // Ne pas afficher d'erreur si la table n'existe pas encore
          }
        }

        // Charger l'historique des objets
        const objectsResponse = await fetch('/api/objects/history');
        const objectsData = await objectsResponse.json();
        
        if (objectsResponse.ok) {
          setObjectHistory(objectsData);
        } else {
          const errorMessage = objectsData.error || 'Erreur lors du chargement de l\'historique des éléments de patrimoine';
          console.error('Erreur API objets:', errorMessage);
          if (errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
            // Ne pas afficher d'erreur si la table n'existe pas encore
          }
        }
      } catch (error: unknown) {
        console.error('Erreur lors du chargement de l\'historique:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement de l\'historique';
        showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [selectedPersonId, user?.status, showToast]);

  // Vérifier que l'utilisateur est administrateur (après tous les hooks)
  if (user?.status !== 'administrateur') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Accès refusé : droits administrateur requis</p>
        </div>
      </div>
    );
  }

  const filteredPositionHistory = positionHistory.filter(item => {
    if (filterAction === 'all') return true;
    return item.action === filterAction;
  });

  const filteredObjectHistory = objectHistory.filter(item => {
    if (filterAction === 'all') return true;
    return item.action === filterAction;
  });

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return 'Créé';
      case 'updated':
        return 'Modifié';
      case 'deleted':
        return 'Position supprimée';
      case 'person_deleted':
        return 'Personne supprimée';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'updated':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'deleted':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'person_deleted':
        return 'bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-300 border-red-300 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getPersonName = (personId: string | null) => {
    if (!personId) {
      return 'Personne supprimée';
    }
    const person = initialPersons.find(p => p.id === personId);
    if (person) {
      return `${person.prenom} ${person.nom}`;
    }
    return `Personne ${personId.substring(0, 8)}...`;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sticky header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
        <header role="banner" className="w-full">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Historique de l&apos;application
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Consultez les modifications des positions dans l&apos;arbre et des éléments de patrimoine.
              </p>
            </div>
            <BackToHomeButton variant="button" />
          </div>
        </header>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-[160px]">
        {/* Onglets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('positions')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors rounded-t-lg ${
                  activeTab === 'positions'
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                Historique des positions
              </button>
              <button
                onClick={() => setActiveTab('objects')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors rounded-t-lg ${
                  activeTab === 'objects'
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                Historique des éléments de patrimoine
              </button>
            </nav>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtre par personne (uniquement pour les positions) */}
            {activeTab === 'positions' && (
              <div>
                <label htmlFor="person-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filtrer par personne
                </label>
                <select
                  id="person-filter"
                  value={selectedPersonId || ''}
                  onChange={(e) => setSelectedPersonId(e.target.value || null)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
                >
                  <option value="">Toutes les personnes</option>
                  {initialPersons.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.prenom} {person.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtre par action */}
            <div>
              <label htmlFor="action-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrer par action
              </label>
              <select
                id="action-filter"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value as typeof filterAction)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
              >
                <option value="all">Toutes les actions</option>
                <option value="created">Créations</option>
                <option value="updated">Modifications</option>
                <option value="deleted">Suppressions</option>
                {activeTab === 'positions' && <option value="person_deleted">Suppressions de personnes</option>}
              </select>
            </div>
          </div>
        </div>

        {/* Liste de l'historique */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Chargement de l'historique...</p>
            </div>
          ) : activeTab === 'positions' ? (
            filteredPositionHistory.length === 0 && positionHistory.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun historique de positions disponible</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Si vous venez de créer la table, déplacez quelques cartes dans l'arbre généalogique pour générer de l'historique.
                </p>
              </div>
            ) : filteredPositionHistory.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Aucun résultat pour les filtres sélectionnés</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPositionHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-lg font-semibold ${!item.personId ? 'text-red-700 dark:text-red-400 italic' : 'text-gray-900 dark:text-white'}`}>
                            {getPersonName(item.personId)}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(item.action)}`}>
                            {getActionLabel(item.action)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {item.action === 'person_deleted' ? (
                            <p className="text-red-600 font-medium">Personne supprimée de l'arbre généalogique</p>
                          ) : (
                            <p>
                              <span className="font-medium">Position:</span> X = {item.x.toFixed(2)}, Y = {item.y.toFixed(2)}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">Date:</span> {new Date(item.updatedAt).toLocaleString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {item.updatedBy && (
                            <p>
                              <span className="font-medium">Par:</span> {item.updatedBy.login} ({item.updatedBy.email})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            filteredObjectHistory.length === 0 && objectHistory.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun historique d'éléments de patrimoine disponible</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  L'historique des éléments de patrimoine sera enregistré automatiquement lors des créations, modifications et suppressions.
                </p>
              </div>
            ) : filteredObjectHistory.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Aucun résultat pour les filtres sélectionnés</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredObjectHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-lg font-semibold ${!item.objectId ? 'text-red-700 dark:text-red-400 italic' : 'text-gray-900 dark:text-white'}`}>
                            {item.objectId ? `Élément de patrimoine ${item.objectId}` : 'Élément de patrimoine supprimé'}
                            {item.newValues?.nom != null && `: ${String(item.newValues.nom)}`}
                            {item.oldValues?.nom != null && item.newValues?.nom == null && `: ${String(item.oldValues.nom)}`}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(item.action)}`}>
                            {getActionLabel(item.action)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {item.action === 'deleted' ? (
                            <p className="text-red-600 font-medium">Élément de patrimoine supprimé</p>
                          ) : item.action === 'updated' && item.changedFields.length > 0 ? (
                            <div>
                              <p className="font-medium mb-1">Champs modifiés:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {item.changedFields.map((field) => {
                                  const fieldLabels: Record<string, string> = {
                                    nom: 'Nom',
                                    type: 'Type',
                                    status: 'Statut',
                                    description: 'Description',
                                    long_description: 'Description longue',
                                    utilisateur_id: 'Utilisateur',
                                  };
                                  const oldValue = item.oldValues?.[field];
                                  const newValue = item.newValues?.[field];
                                  return (
                                    <li key={field} className="text-gray-700 dark:text-gray-300">
                                      <span className="font-medium">{fieldLabels[field] || field}:</span>{' '}
                                      {oldValue !== undefined && oldValue !== null ? (
                                        <span className="line-through text-red-600">{String(oldValue)}</span>
                                      ) : (
                                        <span className="text-gray-400">(vide)</span>
                                      )}
                                      {' → '}
                                      {newValue !== undefined && newValue !== null ? (
                                        <span className="text-green-600">{String(newValue)}</span>
                                      ) : (
                                        <span className="text-gray-400">(vide)</span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : item.action === 'created' ? (
                            <div>
                              <p className="font-medium mb-1">Détails de l'élément de patrimoine créé:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {item.newValues?.nom != null && <li><span className="font-medium">Nom:</span> {String(item.newValues.nom)}</li>}
                                {item.newValues?.type != null && <li><span className="font-medium">Type:</span> {String(item.newValues.type)}</li>}
                                {item.newValues?.status != null && <li><span className="font-medium">Statut:</span> {String(item.newValues.status)}</li>}
                              </ul>
                            </div>
                          ) : null}
                          <p className="mt-2">
                            <span className="font-medium">Date:</span> {new Date(item.updatedAt).toLocaleString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {item.updatedBy && (
                            <p>
                              <span className="font-medium">Par:</span> {item.updatedBy.login} ({item.updatedBy.email})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Statistiques */}
        {!loading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total des modifications {activeTab === 'positions' ? '(positions)' : '(éléments de patrimoine)'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeTab === 'positions' ? positionHistory.length : objectHistory.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Créations</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activeTab === 'positions' 
                  ? positionHistory.filter(h => h.action === 'created').length
                  : objectHistory.filter(h => h.action === 'created').length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Modifications</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {activeTab === 'positions'
                  ? positionHistory.filter(h => h.action === 'updated').length
                  : objectHistory.filter(h => h.action === 'updated').length}
              </p>
            </div>
          </div>
        )}
      </main>
      </div>
    </PageTransition>
  );
}


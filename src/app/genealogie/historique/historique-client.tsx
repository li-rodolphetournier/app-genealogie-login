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
          const errorMessage = objectsData.error || 'Erreur lors du chargement de l\'historique des objets';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'updated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deleted':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'person_deleted':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Historique de l'application</h1>
            <BackToHomeButton variant="button" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Onglets */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('positions')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'positions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Historique des positions
              </button>
              <button
                onClick={() => setActiveTab('objects')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'objects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Historique des objets
              </button>
            </nav>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtre par personne (uniquement pour les positions) */}
            {activeTab === 'positions' && (
              <div>
                <label htmlFor="person-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrer par personne
                </label>
                <select
                  id="person-filter"
                  value={selectedPersonId || ''}
                  onChange={(e) => setSelectedPersonId(e.target.value || null)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
              <label htmlFor="action-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par action
              </label>
              <select
                id="action-filter"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value as typeof filterAction)}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Chargement de l'historique...</p>
            </div>
          ) : activeTab === 'positions' ? (
            filteredPositionHistory.length === 0 && positionHistory.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">Aucun historique de positions disponible</p>
                <p className="text-sm text-gray-400">
                  Si vous venez de créer la table, déplacez quelques cartes dans l'arbre généalogique pour générer de l'historique.
                </p>
              </div>
            ) : filteredPositionHistory.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Aucun résultat pour les filtres sélectionnés</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPositionHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-lg font-semibold ${!item.personId ? 'text-red-700 italic' : 'text-gray-900'}`}>
                            {getPersonName(item.personId)}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(item.action)}`}>
                            {getActionLabel(item.action)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
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
                <p className="text-gray-500 mb-4">Aucun historique d'objets disponible</p>
                <p className="text-sm text-gray-400">
                  L'historique des objets sera enregistré automatiquement lors des créations, modifications et suppressions.
                </p>
              </div>
            ) : filteredObjectHistory.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">Aucun résultat pour les filtres sélectionnés</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredObjectHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-lg font-semibold ${!item.objectId ? 'text-red-700 italic' : 'text-gray-900'}`}>
                            {item.objectId ? `Objet ${item.objectId}` : 'Objet supprimé'}
                            {item.newValues?.nom != null && `: ${String(item.newValues.nom)}`}
                            {item.oldValues?.nom != null && item.newValues?.nom == null && `: ${String(item.oldValues.nom)}`}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(item.action)}`}>
                            {getActionLabel(item.action)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {item.action === 'deleted' ? (
                            <p className="text-red-600 font-medium">Objet supprimé</p>
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
                                    <li key={field} className="text-gray-700">
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
                              <p className="font-medium mb-1">Détails de l'objet créé:</p>
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
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">
                Total des modifications {activeTab === 'positions' ? '(positions)' : '(objets)'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activeTab === 'positions' ? positionHistory.length : objectHistory.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Créations</p>
              <p className="text-2xl font-bold text-green-600">
                {activeTab === 'positions' 
                  ? positionHistory.filter(h => h.action === 'created').length
                  : objectHistory.filter(h => h.action === 'created').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Modifications</p>
              <p className="text-2xl font-bold text-blue-600">
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


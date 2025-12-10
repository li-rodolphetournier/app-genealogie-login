'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ToastProvider';
import { motion } from 'framer-motion';

type Person = {
  id: string;
  nom: string;
  prenom: string;
};

type HistoryItem = {
  id: string;
  personId: string;
  x: number;
  y: number;
  action: 'created' | 'updated' | 'deleted';
  updatedAt: string;
  updatedBy: {
    id: string;
    login: string;
    email: string;
  } | null;
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<'all' | 'created' | 'updated' | 'deleted'>('all');

  // Tous les hooks doivent être appelés avant tout return conditionnel
  useEffect(() => {
    // Ne charger l'historique que si l'utilisateur est admin
    if (user?.status !== 'administrateur') {
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      try {
        let url = '/api/genealogie/positions/history';
        if (selectedPersonId) {
          url += `?person_id=${selectedPersonId}`;
        }
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
          setHistory(data);
        } else {
          const errorMessage = data.error || 'Erreur lors du chargement de l\'historique';
          console.error('Erreur API:', errorMessage, 'Status:', response.status);
          
          // Message d'erreur plus explicite
          if (errorMessage.includes('relation') || errorMessage.includes('does not exist') || errorMessage.includes('n\'existe pas')) {
            showToast('La table d\'historique n\'existe pas. Veuillez exécuter la migration SQL.', 'error');
          } else {
            showToast(errorMessage, 'error');
          }
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement de l\'historique:', error);
        showToast(error.message || 'Erreur lors du chargement de l\'historique', 'error');
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

  const filteredHistory = history.filter(item => {
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
        return 'Supprimé';
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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPersonName = (personId: string) => {
    const person = initialPersons.find(p => p.id === personId);
    if (person) {
      return `${person.prenom} ${person.nom}`;
    }
    return `Personne ${personId.substring(0, 8)}...`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Historique des positions</h1>
            <a
              href="/accueil"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Retour à l'accueil
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtre par personne */}
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
          ) : filteredHistory.length === 0 && history.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">Aucun historique disponible</p>
              <p className="text-sm text-gray-400">
                Si vous venez de créer la table, déplacez quelques cartes dans l'arbre généalogique pour générer de l'historique.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Aucun résultat pour les filtres sélectionnés</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredHistory.map((item, index) => (
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
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getPersonName(item.personId)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(item.action)}`}>
                          {getActionLabel(item.action)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Position:</span> X = {item.x.toFixed(2)}, Y = {item.y.toFixed(2)}
                        </p>
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
          )}
        </div>

        {/* Statistiques */}
        {!loading && history.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Total des modifications</p>
              <p className="text-2xl font-bold text-gray-900">{history.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Créations</p>
              <p className="text-2xl font-bold text-green-600">
                {history.filter(h => h.action === 'created').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Modifications</p>
              <p className="text-2xl font-bold text-blue-600">
                {history.filter(h => h.action === 'updated').length}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


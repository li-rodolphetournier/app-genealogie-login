'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GenealogyForm } from './GenealogyForm';
import type { Person } from '@/types/genealogy';

type HistoryItem = {
  id: string;
  personId: string;
  x: number;
  y: number;
  action: string;
  updatedAt: string;
  updatedBy: { id: string; login: string; email: string } | null;
};

type GenealogyMenuProps = {
  isOpen: boolean;
  canEdit: boolean;
  isEditing: boolean;
  historyOpen: boolean;
  loadingHistory: boolean;
  history: HistoryItem[];
  formData: Omit<Person, 'id'>;
  persons: Person[];
  selectedNode: { name: string; description: string; dateNaissance: string; dateDeces: string | null; image: string | null } | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onImageUploadSuccess: (imageUrl: string) => void;
  onImageUploadError: (errorMessage: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  onToggleHistory?: () => void;
};

export function GenealogyMenu({
  isOpen,
  canEdit,
  isEditing,
  historyOpen,
  loadingHistory,
  history,
  formData,
  persons,
  selectedNode,
  onInputChange,
  onImageUploadSuccess,
  onImageUploadError,
  onSubmit,
  onCancel,
  onToggleHistory
}: GenealogyMenuProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed left-0 top-0 h-full bg-white shadow-lg z-10"
        style={{ width: '24rem' }}
        initial={{ x: -384 }}
        animate={{ x: 0 }}
        exit={{ x: -384 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {canEdit ? (
          <div className="h-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4 flex-col gap-4">
              <h2 className="text-xl font-bold">
                {historyOpen ? "Historique des positions" : (isEditing ? "Modifier une personne" : "Ajouter une personne")}
              </h2>
              <div className="flex flex-wrap gap-2 w-full justify-center">
                {!historyOpen && isEditing && onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Ajouter une personne
                  </button>
                )}
                {onToggleHistory && (
                  <button
                    onClick={onToggleHistory}
                    className={`px-4 py-2 rounded ${
                      historyOpen
                        ? 'bg-blue-500 text-white'
                        : 'bg-purple-500 text-white'
                    }`}
                  >
                    {historyOpen ? 'Fermer' : 'Historique'}
                  </button>
                )}
              </div>
            </div>

            {historyOpen ? (
              <div className="space-y-4">
                {loadingHistory ? (
                  <p className="text-gray-500">Chargement de l'historique...</p>
                ) : history.length === 0 ? (
                  <p className="text-gray-500">Aucun historique disponible</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => {
                      const person = persons.find(p => p.id === item.personId);
                      return (
                        <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">
                                {person ? `${person.prenom} ${person.nom}` : `Personne ${item.personId.substring(0, 8)}...`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(item.updatedAt).toLocaleString('fr-FR')}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.action === 'created' ? 'bg-green-100 text-green-800' :
                              item.action === 'updated' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.action === 'created' ? 'Créé' : item.action === 'updated' ? 'Modifié' : 'Supprimé'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            <p>Position: X={item.x.toFixed(2)}, Y={item.y.toFixed(2)}</p>
                            {item.updatedBy && (
                              <p className="mt-1">Par: {item.updatedBy.login}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <GenealogyForm
                formData={formData}
                isEditing={isEditing}
                persons={persons}
                onInputChange={onInputChange}
                onImageUploadSuccess={onImageUploadSuccess}
                onImageUploadError={onImageUploadError}
                onSubmit={onSubmit}
                onCancel={onCancel}
              />
            )}
          </div>
        ) : (
          <div className="h-full p-6 overflow-y-auto">
            {selectedNode ? (
              <>
                <h2 className="text-xl font-bold mb-6">Détails de la personne</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom complet</label>
                    <p className="w-full border rounded p-2 bg-gray-50">{selectedNode.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <p className="w-full border rounded p-2 bg-gray-50">{selectedNode.description || 'Aucune description'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date de naissance</label>
                    <p className="w-full border rounded p-2 bg-gray-50">
                      {selectedNode.dateNaissance ? new Date(selectedNode.dateNaissance).toLocaleDateString() : 'Non renseignée'}
                    </p>
                  </div>
                  {selectedNode.dateDeces && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Date de décès</label>
                      <p className="w-full border rounded p-2 bg-gray-50">
                        {new Date(selectedNode.dateDeces).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedNode.image && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Photo</label>
                      <img
                        src={selectedNode.image}
                        alt={selectedNode.name}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">
                  Sélectionnez une personne pour voir ses informations
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}


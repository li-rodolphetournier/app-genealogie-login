'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileUploader } from '@/components/file-uploader';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import type { Person } from '@/types/genealogy';

type GenealogyFormProps = {
  formData: Omit<Person, 'id'>;
  isEditing: boolean;
  editingId: string | null;
  persons: Person[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onImageUploadSuccess: (imageUrl: string) => void;
  onImageUploadError: (errorMessage: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  onDelete?: (id: string) => void;
};

export function GenealogyForm({
  formData,
  isEditing,
  editingId,
  persons,
  onInputChange,
  onImageUploadSuccess,
  onImageUploadError,
  onSubmit,
  onCancel,
  onDelete
}: GenealogyFormProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (editingId && onDelete) {
      onDelete(editingId);
      setIsDeleteModalOpen(false);
    }
  };

  const personName = editingId 
    ? persons.find(p => p.id === editingId) 
      ? `${persons.find(p => p.id === editingId)?.prenom} ${persons.find(p => p.id === editingId)?.nom}`
      : 'cette personne'
    : 'cette personne';

  return (
    <motion.form 
      onSubmit={onSubmit} 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      key={isEditing ? `edit-${formData.prenom}` : 'add'}
    >
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Prénom</label>
        <input
          type="text"
          name="prenom"
          value={formData.prenom}
          onChange={onInputChange}
          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nom</label>
        <input
          type="text"
          name="nom"
          value={formData.nom}
          onChange={onInputChange}
          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Si non renseigné, le nom du père sera utilisé
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Genre</label>
        <select
          name="genre"
          value={formData.genre}
          onChange={onInputChange}
          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="homme">Homme</option>
          <option value="femme">Femme</option>
        </select>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description (Courte)
        </label>
        <textarea 
          name="description" 
          id="description" 
          value={formData.description} 
          onChange={onInputChange} 
          rows={3} 
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Père</label>
        <select
          name="pere"
          value={formData.pere || ''}
          onChange={onInputChange}
          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Aucun</option>
          {persons
            .filter(person => person.genre === 'homme')
            .map(person => (
              <option key={person.id} value={person.id}>
                {person.prenom} {person.nom} (né en {new Date(person.dateNaissance).getFullYear()})
              </option>
            ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Mère</label>
        <select
          name="mere"
          value={formData.mere || ''}
          onChange={onInputChange}
          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Aucune</option>
          {persons
            .filter(person => person.genre === 'femme')
            .map(person => (
              <option key={person.id} value={person.id}>
                {person.prenom} {person.nom} (née en {new Date(person.dateNaissance).getFullYear()})
              </option>
            ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Photo de profil</label>
        <div className="flex items-center space-x-4 flex-wrap">
          {formData.image && (
            <div className="flex-shrink-0">
              <img
                src={formData.image}
                alt="Preview"
                className="h-24 w-24 object-cover rounded-full border border-gray-300 dark:border-gray-600"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <FileUploader
              onFileSelect={() => {}}
              onUploadComplete={(urls) => {
                if (urls.length > 0) {
                  onImageUploadSuccess(urls[0]);
                }
              }}
              onError={onImageUploadError}
              folder="genealogie"
              maxFileSizeMB={2}
              multiple={false}
              accept="image/*"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date de naissance</label>
        <input
          type="date"
          name="dateNaissance"
          value={formData.dateNaissance}
          onChange={onInputChange}
          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date de décès</label>
        <input
          type="date"
          name="dateDeces"
          value={formData.dateDeces || ''}
          onChange={onInputChange}
          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Ordre de naissance</label>
        <input
          type="number"
          name="ordreNaissance"
          value={formData.ordreNaissance}
          onChange={onInputChange}
          className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          min="1"
          required
        />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex space-x-2">
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            {isEditing ? "Mettre à jour" : "Ajouter à l'arbre"}
          </button>
          {isEditing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Annuler
            </button>
          )}
        </div>
        {isEditing && editingId && onDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            className="w-full bg-red-500 text-white py-2.5 rounded hover:bg-red-600 transition-colors font-medium"
          >
            🗑️ Supprimer cette personne
          </button>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer ${personName} ? Cette action est irréversible et supprimera également toutes les références à cette personne dans l'arbre généalogique.`}
      />
    </motion.form>
  );
}


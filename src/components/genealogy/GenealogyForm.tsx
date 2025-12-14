'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GenericImageUploader from '@/components/ImageUploader';
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
        <label className="block text-sm font-medium mb-1">Prénom</label>
        <input
          type="text"
          name="prenom"
          value={formData.prenom}
          onChange={onInputChange}
          className="w-full border rounded p-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Nom</label>
        <input
          type="text"
          name="nom"
          value={formData.nom}
          onChange={onInputChange}
          className="w-full border rounded p-2"
        />
        <p className="mt-1 text-sm text-gray-500">
          Si non renseigné, le nom du père sera utilisé
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Genre</label>
        <select
          name="genre"
          value={formData.genre}
          onChange={onInputChange}
          className="w-full border rounded p-2"
        >
          <option value="homme">Homme</option>
          <option value="femme">Femme</option>
        </select>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description (Courte)
        </label>
        <textarea 
          name="description" 
          id="description" 
          value={formData.description} 
          onChange={onInputChange} 
          rows={3} 
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Père</label>
        <select
          name="pere"
          value={formData.pere || ''}
          onChange={onInputChange}
          className="w-full border rounded p-2"
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
        <label className="block text-sm font-medium mb-1">Mère</label>
        <select
          name="mere"
          value={formData.mere || ''}
          onChange={onInputChange}
          className="w-full border rounded p-2"
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
        <label className="block text-sm font-medium mb-1">Photo de profil</label>
        <GenericImageUploader
          onUploadSuccess={onImageUploadSuccess}
          onError={onImageUploadError}
          onUploadStart={() => {}}
        >
          <button 
            type="button" 
            className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Choisir une image
          </button>
        </GenericImageUploader>
        {formData.image && (
          <div className="mt-2">
            <img
              src={formData.image}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-full"
            />
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Date de naissance</label>
        <input
          type="date"
          name="dateNaissance"
          value={formData.dateNaissance}
          onChange={onInputChange}
          className="w-full border rounded p-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Date de décès</label>
        <input
          type="date"
          name="dateDeces"
          value={formData.dateDeces || ''}
          onChange={onInputChange}
          className="w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Ordre de naissance</label>
        <input
          type="number"
          name="ordreNaissance"
          value={formData.ordreNaissance}
          onChange={onInputChange}
          className="w-full border rounded p-2"
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


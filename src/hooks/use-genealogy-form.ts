import { useState, useCallback } from 'react';
import type { Person } from '@/types/genealogy';

const initialFormData: Omit<Person, 'id'> = {
  nom: '',
  prenom: '',
  genre: 'homme',
  description: '',
  mere: null,
  pere: null,
  ordreNaissance: 1,
  dateNaissance: '',
  dateDeces: null,
  image: null
};

export function useGenealogyForm() {
  const [formData, setFormData] = useState<Omit<Person, 'id'>>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' && (name === 'mere' || name === 'pere' || name === 'dateDeces' || name === 'image') 
        ? null 
        : value
    }));
  }, []);

  const handleImageUploadSuccess = useCallback((imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl
    }));
  }, []);

  const resetForm = useCallback(() => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(initialFormData);
  }, []);

  const loadPersonIntoForm = useCallback((person: Person) => {
    setFormData({
      nom: person.nom,
      prenom: person.prenom,
      genre: person.genre,
      description: person.description,
      mere: person.mere,
      pere: person.pere,
      ordreNaissance: person.ordreNaissance,
      dateNaissance: person.dateNaissance,
      dateDeces: person.dateDeces,
      image: person.image
    });
    setEditingId(person.id);
    setIsEditing(true);
  }, []);

  return {
    formData,
    isEditing,
    editingId,
    setFormData,
    setIsEditing,
    setEditingId,
    handleInputChange,
    handleImageUploadSuccess,
    resetForm,
    loadPersonIntoForm
  };
}


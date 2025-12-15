import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGenealogyForm } from '../use-genealogy-form';
import type { Person } from '@/types/genealogy';

describe('useGenealogyForm', () => {
  it('devrait initialiser le formulaire avec les valeurs par défaut', () => {
    const { result } = renderHook(() => useGenealogyForm());
    expect(result.current.formData.nom).toBe('');
    expect(result.current.formData.genre).toBe('homme');
    expect(result.current.isEditing).toBe(false);
    expect(result.current.editingId).toBeNull();
  });

  it('devrait mettre à jour les champs via handleInputChange', () => {
    const { result } = renderHook(() => useGenealogyForm());

    act(() => {
      result.current.handleInputChange({
        target: { name: 'nom', value: 'Dupont' },
      } as any);
    });

    expect(result.current.formData.nom).toBe('Dupont');
  });

  it('devrait charger une personne dans le formulaire et activer le mode édition', () => {
    const { result } = renderHook(() => useGenealogyForm());
    const person: Person = {
      id: 'p1',
      nom: 'Dupont',
      prenom: 'Jean',
      genre: 'homme',
      description: 'desc',
      mere: null,
      pere: null,
      ordreNaissance: 1,
      dateNaissance: '2000-01-01',
      dateDeces: null,
      image: null,
    };

    act(() => {
      result.current.loadPersonIntoForm(person);
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.editingId).toBe('p1');
    expect(result.current.formData.nom).toBe('Dupont');
  });

  it('devrait reset le formulaire', () => {
    const { result } = renderHook(() => useGenealogyForm());

    act(() => {
      result.current.setFormData((prev) => ({ ...prev, nom: 'X' }));
      result.current.setIsEditing(true);
      result.current.setEditingId('p2');
      result.current.resetForm();
    });

    expect(result.current.formData.nom).toBe('');
    expect(result.current.isEditing).toBe(false);
    expect(result.current.editingId).toBeNull();
  });
});



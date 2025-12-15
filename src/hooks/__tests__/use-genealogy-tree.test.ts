import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGenealogyTree, type TreeNode } from '../use-genealogy-tree';
import type { Person } from '@/types/genealogy';

const makePerson = (overrides: Partial<Person>): Person => ({
  id: 'id',
  nom: 'Nom',
  prenom: 'Prenom',
  genre: 'homme',
  description: '',
  mere: null,
  pere: null,
  ordreNaissance: 1,
  dateNaissance: '2000-01-01',
  dateDeces: null,
  image: null,
  ...overrides,
});

describe('useGenealogyTree', () => {
  it('devrait retourner null si aucune personne', () => {
    const { result } = renderHook(() => useGenealogyTree([]));
    expect(result.current).toBeNull();
  });

  it('devrait construire un arbre simple avec parent et enfant', () => {
    const parent = makePerson({ id: 'p1', prenom: 'Parent', nom: 'Test' });
    const child = makePerson({ id: 'c1', prenom: 'Enfant', pere: 'p1', ordreNaissance: 1 });

    const { result } = renderHook(() => useGenealogyTree([parent, child]));

    const root = result.current as TreeNode;
    expect(root.id).toBe('p1');
    expect(root.children).toHaveLength(1);
    expect(root.children?.[0].id).toBe('c1');
  });
});



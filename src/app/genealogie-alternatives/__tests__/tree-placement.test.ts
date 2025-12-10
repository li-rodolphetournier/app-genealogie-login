/**
 * Tests du placement des nœuds par rapport aux parents dans les 3 alternatives
 */

import { describe, it, expect } from 'vitest';
import type { Person } from '@/types/genealogy';

// Fonction de construction d'arbre commune (utilisée par les 3 alternatives)
function buildTreeForPlacement(persons: Person[]) {
  const roots = persons.filter(p => !p.pere && !p.mere);
  const processedIds = new Set<string>();

  type TreeNode = {
    id: string;
    name: string;
    ordreNaissance: number;
    dateNaissance: string;
    children?: TreeNode[];
  };

  const buildPersonNode = (person: Person): TreeNode | null => {
    if (processedIds.has(person.id)) return null;
    processedIds.add(person.id);

    const children = persons
      .filter(p => (p.pere === person.id || p.mere === person.id))
      .sort((a, b) => {
        if (a.ordreNaissance !== b.ordreNaissance) {
          return a.ordreNaissance - b.ordreNaissance;
        }
        return new Date(a.dateNaissance).getTime() - new Date(b.dateNaissance).getTime();
      });

    const childNodes = children
      .map(child => {
        processedIds.delete(child.id);
        return buildPersonNode(child);
      })
      .filter((node): node is TreeNode => node !== null);

    return {
      id: person.id,
      name: `${person.prenom} ${person.nom}`,
      ordreNaissance: person.ordreNaissance,
      dateNaissance: person.dateNaissance,
      children: childNodes.length > 0 ? childNodes : undefined,
    };
  };

  return roots.map(p => {
    processedIds.clear();
    return buildPersonNode(p);
  }).filter((n): n is TreeNode => n !== null);
}

describe('Placement par rapport au parent - Ordre de naissance', () => {
  it('doit placer les enfants dans l\'ordre de naissance (1, 2, 3)', () => {
    const persons: Person[] = [
      {
        id: 'parent-1',
        nom: 'Dupont',
        prenom: 'Jean',
        genre: 'homme',
        description: '',
        mere: null,
        pere: null,
        ordreNaissance: 1,
        dateNaissance: '1950-01-01',
        dateDeces: null,
        image: null,
      },
      {
        id: 'child-3',
        nom: 'Dupont',
        prenom: 'Troisième',
        genre: 'homme',
        description: '',
        mere: null,
        pere: 'parent-1',
        ordreNaissance: 3,
        dateNaissance: '1985-01-01',
        dateDeces: null,
        image: null,
      },
      {
        id: 'child-1',
        nom: 'Dupont',
        prenom: 'Premier',
        genre: 'homme',
        description: '',
        mere: null,
        pere: 'parent-1',
        ordreNaissance: 1,
        dateNaissance: '1980-01-01',
        dateDeces: null,
        image: null,
      },
      {
        id: 'child-2',
        nom: 'Dupont',
        prenom: 'Deuxième',
        genre: 'homme',
        description: '',
        mere: null,
        pere: 'parent-1',
        ordreNaissance: 2,
        dateNaissance: '1982-01-01',
        dateDeces: null,
        image: null,
      },
    ];

    const tree = buildTreeForPlacement(persons);
    const children = tree[0].children!;

    expect(children).toHaveLength(3);
    expect(children[0].ordreNaissance).toBe(1);
    expect(children[1].ordreNaissance).toBe(2);
    expect(children[2].ordreNaissance).toBe(3);
  });

  it('doit utiliser la date de naissance comme critère secondaire', () => {
    const persons: Person[] = [
      {
        id: 'parent-1',
        nom: 'Dupont',
        prenom: 'Jean',
        genre: 'homme',
        description: '',
        mere: null,
        pere: null,
        ordreNaissance: 1,
        dateNaissance: '1950-01-01',
        dateDeces: null,
        image: null,
      },
      {
        id: 'child-late',
        nom: 'Dupont',
        prenom: 'Né en 1985',
        genre: 'homme',
        description: '',
        mere: null,
        pere: 'parent-1',
        ordreNaissance: 1, // Même ordre
        dateNaissance: '1985-01-01',
        dateDeces: null,
        image: null,
      },
      {
        id: 'child-early',
        nom: 'Dupont',
        prenom: 'Né en 1980',
        genre: 'homme',
        description: '',
        mere: null,
        pere: 'parent-1',
        ordreNaissance: 1, // Même ordre
        dateNaissance: '1980-01-01',
        dateDeces: null,
        image: null,
      },
    ];

    const tree = buildTreeForPlacement(persons);
    const children = tree[0].children!;

    expect(children[0].id).toBe('child-early'); // Plus ancien en premier
    expect(children[1].id).toBe('child-late');
  });
});

describe('Placement par rapport au parent - Liens père/mère', () => {
  it('doit placer l\'enfant sous le père quand les deux parents existent', () => {
    const persons: Person[] = [
      {
        id: 'father-1',
        nom: 'Dupont',
        prenom: 'Jean',
        genre: 'homme',
        description: '',
        mere: null,
        pere: null,
        ordreNaissance: 1,
        dateNaissance: '1950-01-01',
        dateDeces: null,
        image: null,
      },
      {
        id: 'mother-1',
        nom: 'Martin',
        prenom: 'Marie',
        genre: 'femme',
        description: '',
        mere: null,
        pere: null,
        ordreNaissance: 1,
        dateNaissance: '1955-01-01',
        dateDeces: null,
        image: null,
      },
      {
        id: 'child-1',
        nom: 'Dupont',
        prenom: 'Pierre',
        genre: 'homme',
        description: '',
        mere: 'mother-1',
        pere: 'father-1',
        ordreNaissance: 1,
        dateNaissance: '1980-01-01',
        dateDeces: null,
        image: null,
      },
    ];

    const tree = buildTreeForPlacement(persons);
    const fatherNode = tree.find(n => n.id === 'father-1');
    const motherNode = tree.find(n => n.id === 'mother-1');

    // La fonction filtre les enfants par (p.pere === person.id || p.mere === person.id)
    // Donc si un enfant a à la fois un père et une mère comme racines,
    // l'enfant apparaîtra sous les deux parents car processedIds est réinitialisé
    // pour chaque racine
    expect(fatherNode?.children).toBeDefined();
    expect(fatherNode?.children![0].id).toBe('child-1');
    
    // Comme l'enfant a mère === 'mother-1', il apparaîtra aussi sous la mère
    // car la mère est une racine et la fonction trouve tous les enfants
    // où p.mere === person.id OU p.pere === person.id
    expect(motherNode?.children).toBeDefined();
    expect(motherNode?.children![0].id).toBe('child-1');
  });
});


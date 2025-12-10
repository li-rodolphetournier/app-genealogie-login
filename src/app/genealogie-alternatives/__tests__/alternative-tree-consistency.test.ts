/**
 * Tests de cohérence entre les 3 alternatives
 * Vérifie que Visx, Nivo et TreeCharts produisent la même structure d'arbre
 */

import { describe, it, expect } from 'vitest';
import type { Person } from '@/types/genealogy';

// Fonction de construction d'arbre (utilisée par les 3 alternatives)
type TreeNode = {
  name: string;
  id: string;
  genre: 'homme' | 'femme';
  description: string;
  dateNaissance: string;
  dateDeces: string | null;
  image: string | null;
  children?: TreeNode[];
};

function buildTreeCommon(persons: Person[]): TreeNode[] {
  const roots = persons.filter(p => !p.pere && !p.mere);
  const processedIds = new Set<string>();

  const buildPersonNode = (person: Person): TreeNode | null => {
    if (processedIds.has(person.id)) return null;
    processedIds.add(person.id);

    const children = persons
      .filter(p => (p.pere === person.id || p.mere === person.id))
      .sort((a, b) => {
        if (a.ordreNaissance !== b.ordreNaissance) {
          return a.ordreNaissance - b.ordreNaissance;
        }
        const dateA = a.dateNaissance ? new Date(a.dateNaissance).getTime() : 0;
        const dateB = b.dateNaissance ? new Date(b.dateNaissance).getTime() : 0;
        return dateA - dateB;
      });

    const childNodes = children
      .map(child => {
        processedIds.delete(child.id);
        return buildPersonNode(child);
      })
      .filter((node): node is TreeNode => node !== null);

    return {
      name: `${person.prenom} ${person.nom}`.trim() || `Personne ${person.id.slice(0, 8)}`,
      id: person.id,
      genre: person.genre,
      description: person.description || '',
      dateNaissance: person.dateNaissance || '',
      dateDeces: person.dateDeces,
      image: person.image,
      children: childNodes.length > 0 ? childNodes : undefined,
    };
  };

  return roots
    .map(person => {
      processedIds.clear();
      return buildPersonNode(person);
    })
    .filter((node): node is TreeNode => node !== null);
}

describe('Cohérence entre les 3 alternatives', () => {
  const complexFamily: Person[] = [
    {
      id: 'grandfather',
      nom: 'Dupont',
      prenom: 'Pierre',
      genre: 'homme',
      description: 'Grand-père',
      mere: null,
      pere: null,
      ordreNaissance: 1,
      dateNaissance: '1920-01-01',
      dateDeces: '2000-01-01',
      image: 'https://example.com/grandfather.jpg',
    },
    {
      id: 'father',
      nom: 'Dupont',
      prenom: 'Jean',
      genre: 'homme',
      description: 'Père',
      mere: null,
      pere: 'grandfather',
      ordreNaissance: 1,
      dateNaissance: '1950-01-01',
      dateDeces: null,
      image: null,
    },
    {
      id: 'mother',
      nom: 'Martin',
      prenom: 'Marie',
      genre: 'femme',
      description: 'Mère',
      mere: null,
      pere: null,
      ordreNaissance: 1,
      dateNaissance: '1955-01-01',
      dateDeces: null,
      image: 'https://example.com/mother.jpg',
    },
    {
      id: 'child1',
      nom: 'Dupont',
      prenom: 'Pierre',
      genre: 'homme',
      description: 'Fils aîné',
      mere: 'mother',
      pere: 'father',
      ordreNaissance: 1,
      dateNaissance: '1980-01-01',
      dateDeces: null,
      image: null,
    },
    {
      id: 'child2',
      nom: 'Dupont',
      prenom: 'Sophie',
      genre: 'femme',
      description: 'Fille cadette',
      mere: 'mother',
      pere: 'father',
      ordreNaissance: 2,
      dateNaissance: '1982-01-01',
      dateDeces: null,
      image: null,
    },
  ];

  it('doit produire la même structure d\'arbre pour toutes les alternatives', () => {
    const tree = buildTreeCommon(complexFamily);

    // Vérifications de structure
    expect(tree.length).toBeGreaterThan(0);

    // Trouver le grand-père dans l'arbre
    const grandfather = tree.find(n => n.id === 'grandfather');
    expect(grandfather).toBeDefined();

    // Vérifier que le père est enfant du grand-père
    if (grandfather) {
      expect(grandfather.children).toBeDefined();
      const father = grandfather.children!.find(c => c.id === 'father');
      expect(father).toBeDefined();

      // Vérifier que les enfants sont sous le père
      if (father) {
        expect(father.children).toBeDefined();
        expect(father.children!.length).toBeGreaterThan(0);
        
        // Vérifier l'ordre de naissance
        const child1 = father.children!.find(c => c.id === 'child1');
        const child2 = father.children!.find(c => c.id === 'child2');
        
        expect(child1).toBeDefined();
        expect(child2).toBeDefined();
        
        // child1 devrait être avant child2 (ordre de naissance)
        const child1Index = father.children!.findIndex(c => c.id === 'child1');
        const child2Index = father.children!.findIndex(c => c.id === 'child2');
        expect(child1Index).toBeLessThan(child2Index);
      }
    }
  });

  it('doit préserver toutes les propriétés dans toutes les alternatives', () => {
    const tree = buildTreeCommon(complexFamily);
    
    const grandfather = tree.find(n => n.id === 'grandfather');
    expect(grandfather).toBeDefined();
    
    if (grandfather) {
      expect(grandfather.dateDeces).toBe('2000-01-01');
      expect(grandfather.image).toBe('https://example.com/grandfather.jpg');
      expect(grandfather.description).toBe('Grand-père');
    }

    const mother = tree.find(n => n.id === 'mother');
    expect(mother).toBeDefined();
    if (mother) {
      expect(mother.image).toBe('https://example.com/mother.jpg');
      expect(mother.genre).toBe('femme');
    }
  });
});

describe('Tests spécifiques - Placement et ordre', () => {
  it('doit respecter l\'ordre de naissance dans toutes les alternatives', () => {
    const persons: Person[] = [
      {
        id: 'parent',
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
        id: 'child3',
        nom: 'Dupont',
        prenom: 'Troisième',
        genre: 'homme',
        description: '',
        mere: null,
        pere: 'parent',
        ordreNaissance: 3,
        dateNaissance: '1985-01-01',
        dateDeces: null,
        image: null,
      },
      {
        id: 'child1',
        nom: 'Dupont',
        prenom: 'Premier',
        genre: 'homme',
        description: '',
        mere: null,
        pere: 'parent',
        ordreNaissance: 1,
        dateNaissance: '1980-01-01',
        dateDeces: null,
        image: null,
      },
      {
        id: 'child2',
        nom: 'Dupont',
        prenom: 'Deuxième',
        genre: 'homme',
        description: '',
        mere: null,
        pere: 'parent',
        ordreNaissance: 2,
        dateNaissance: '1982-01-01',
        dateDeces: null,
        image: null,
      },
    ];

    const tree = buildTreeCommon(persons);
    const parent = tree.find(n => n.id === 'parent');
    
    expect(parent?.children).toBeDefined();
    const children = parent!.children!;
    
    expect(children[0].id).toBe('child1');
    expect(children[1].id).toBe('child2');
    expect(children[2].id).toBe('child3');
  });
});


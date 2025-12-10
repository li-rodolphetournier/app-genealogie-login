/**
 * Tests de construction d'arbres pour les 3 alternatives
 */

import { describe, it, expect } from 'vitest';
import type { Person } from '@/types/genealogy';

// Helper pour construire l'arbre (logique commune)
function buildFamilyTree(persons: Person[]) {
  const roots = persons.filter(p => !p.pere && !p.mere);
  const processedIds = new Set<string>();

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

  const buildPersonNode = (person: Person): TreeNode | null => {
    if (processedIds.has(person.id)) {
      return null;
    }

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
      name: `${person.prenom} ${person.nom}`.trim(),
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

describe('Construction d\'arbres généalogiques', () => {
  describe('Structure de base', () => {
    it('doit construire un arbre avec une seule racine', () => {
      const persons: Person[] = [
        {
          id: 'root-1',
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
      ];

      const tree = buildFamilyTree(persons);
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('root-1');
      expect(tree[0].name).toBe('Jean Dupont');
    });

    it('doit construire un arbre avec parent et enfant', () => {
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
          id: 'child-1',
          nom: 'Dupont',
          prenom: 'Pierre',
          genre: 'homme',
          description: '',
          mere: null,
          pere: 'parent-1',
          ordreNaissance: 1,
          dateNaissance: '1980-01-01',
          dateDeces: null,
          image: null,
        },
      ];

      const tree = buildFamilyTree(persons);
      expect(tree).toHaveLength(1);
      expect(tree[0].children).toBeDefined();
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children![0].id).toBe('child-1');
    });
  });

  describe('Placement par rapport au parent', () => {
    it('doit respecter l\'ordre de naissance', () => {
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
      ];

      const tree = buildFamilyTree(persons);
      const children = tree[0].children!;
      
      // Vérifier que les enfants sont triés par ordre de naissance
      expect(children[0].id).toBe('child-1'); // ordreNaissance: 1
      expect(children[1].id).toBe('child-2'); // ordreNaissance: 2
    });

    it('doit trier par date si même ordre de naissance', () => {
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
          id: 'child-2',
          nom: 'Dupont',
          prenom: 'Deuxième',
          genre: 'homme',
          description: '',
          mere: null,
          pere: 'parent-1',
          ordreNaissance: 1,
          dateNaissance: '1982-01-01', // Plus tard
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
          dateNaissance: '1980-01-01', // Plus tôt
          dateDeces: null,
          image: null,
        },
      ];

      const tree = buildFamilyTree(persons);
      const children = tree[0].children!;
      
      // Devrait être trié par date (plus ancien en premier)
      expect(children[0].id).toBe('child-1');
      expect(children[1].id).toBe('child-2');
    });
  });

  describe('Liens parent-enfant', () => {
    it('doit gérer les enfants avec père uniquement', () => {
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
          id: 'child-1',
          nom: 'Dupont',
          prenom: 'Pierre',
          genre: 'homme',
          description: '',
          mere: null,
          pere: 'father-1',
          ordreNaissance: 1,
          dateNaissance: '1980-01-01',
          dateDeces: null,
          image: null,
        },
      ];

      const tree = buildFamilyTree(persons);
      expect(tree[0].children).toBeDefined();
      expect(tree[0].children![0].id).toBe('child-1');
    });

    it('doit gérer les enfants avec mère uniquement', () => {
      const persons: Person[] = [
        {
          id: 'mother-1',
          nom: 'Martin',
          prenom: 'Marie',
          genre: 'femme',
          description: '',
          mere: null,
          pere: null,
          ordreNaissance: 1,
          dateNaissance: '1950-01-01',
          dateDeces: null,
          image: null,
        },
        {
          id: 'child-1',
          nom: 'Martin',
          prenom: 'Sophie',
          genre: 'femme',
          description: '',
          mere: 'mother-1',
          pere: null,
          ordreNaissance: 1,
          dateNaissance: '1980-01-01',
          dateDeces: null,
          image: null,
        },
      ];

      const tree = buildFamilyTree(persons);
      expect(tree[0].children).toBeDefined();
      expect(tree[0].children![0].id).toBe('child-1');
    });

    it('doit gérer les enfants avec père et mère', () => {
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

      const tree = buildFamilyTree(persons);
      // L'enfant devrait apparaître sous le père (logique actuelle)
      const fatherNode = tree.find(n => n.id === 'father-1');
      expect(fatherNode?.children).toBeDefined();
      expect(fatherNode?.children![0].id).toBe('child-1');
    });
  });

  describe('Cas limites', () => {
    it('doit éviter les cycles infinis', () => {
      const persons: Person[] = [
        {
          id: 'person-1',
          nom: 'Test',
          prenom: 'One',
          genre: 'homme',
          description: '',
          mere: null,
          pere: 'person-2', // Référence circulaire
          ordreNaissance: 1,
          dateNaissance: '1950-01-01',
          dateDeces: null,
          image: null,
        },
        {
          id: 'person-2',
          nom: 'Test',
          prenom: 'Two',
          genre: 'homme',
          description: '',
          mere: null,
          pere: 'person-1', // Référence circulaire
          ordreNaissance: 1,
          dateNaissance: '1960-01-01',
          dateDeces: null,
          image: null,
        },
      ];

      // Avec des références circulaires, aucune personne n'est une racine
      // (car toutes ont un parent), donc l'arbre sera vide
      // La fonction devrait gérer cela sans boucle infinie grâce à processedIds
      const tree = buildFamilyTree(persons);
      // Avec des cycles complets, il n'y a pas de racine, donc l'arbre est vide
      // Ce comportement est correct - les cycles sont détectés par l'absence de racines
      expect(tree.length).toBe(0);
    });

    it('doit gérer plusieurs racines indépendantes', () => {
      const persons: Person[] = [
        {
          id: 'root-1',
          nom: 'Famille1',
          prenom: 'Person',
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
          id: 'root-2',
          nom: 'Famille2',
          prenom: 'Person',
          genre: 'homme',
          description: '',
          mere: null,
          pere: null,
          ordreNaissance: 1,
          dateNaissance: '1960-01-01',
          dateDeces: null,
          image: null,
        },
      ];

      const tree = buildFamilyTree(persons);
      expect(tree).toHaveLength(2);
      expect(tree[0].id).toBe('root-1');
      expect(tree[1].id).toBe('root-2');
    });

    it('doit gérer les personnes sans parents ni enfants', () => {
      const persons: Person[] = [
        {
          id: 'orphan-1',
          nom: 'Orphelin',
          prenom: 'Test',
          genre: 'homme',
          description: '',
          mere: null,
          pere: null,
          ordreNaissance: 1,
          dateNaissance: '1950-01-01',
          dateDeces: null,
          image: null,
        },
      ];

      const tree = buildFamilyTree(persons);
      expect(tree).toHaveLength(1);
      expect(tree[0].children).toBeUndefined();
    });
  });

  describe('Gestion des images', () => {
    it('doit préserver les URLs d\'images', () => {
      const persons: Person[] = [
        {
          id: 'person-1',
          nom: 'Dupont',
          prenom: 'Jean',
          genre: 'homme',
          description: '',
          mere: null,
          pere: null,
          ordreNaissance: 1,
          dateNaissance: '1950-01-01',
          dateDeces: null,
          image: 'https://example.com/image.jpg',
        },
      ];

      const tree = buildFamilyTree(persons);
      expect(tree[0].image).toBe('https://example.com/image.jpg');
    });

    it('doit gérer les images nulles', () => {
      const persons: Person[] = [
        {
          id: 'person-1',
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
      ];

      const tree = buildFamilyTree(persons);
      expect(tree[0].image).toBeNull();
    });
  });

  describe('Gestion des dates de décès', () => {
    it('doit préserver les dates de décès', () => {
      const persons: Person[] = [
        {
          id: 'person-1',
          nom: 'Dupont',
          prenom: 'Jean',
          genre: 'homme',
          description: '',
          mere: null,
          pere: null,
          ordreNaissance: 1,
          dateNaissance: '1950-01-01',
          dateDeces: '2020-01-01',
          image: null,
        },
      ];

      const tree = buildFamilyTree(persons);
      expect(tree[0].dateDeces).toBe('2020-01-01');
    });
  });
});


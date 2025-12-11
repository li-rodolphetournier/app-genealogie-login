import { useMemo } from 'react';
import type { Person } from '@/types/genealogy';

export type TreeNode = {
  name: string;
  id: string;
  genre: 'homme' | 'femme';
  description: string;
  dateNaissance: string;
  dateDeces: string | null;
  image: string | null;
  children?: TreeNode[];
};

export function useGenealogyTree(persons: Person[]) {
  const treeData = useMemo(() => {
    const buildFamilyTree = (personsData: Person[]): TreeNode[] => {
      const roots = personsData.filter(p => !p.pere && !p.mere);
      const processedIds = new Set<string>();

      const buildPersonNode = (person: Person): TreeNode | null => {
        if (processedIds.has(person.id)) {
          return null;
        }

        processedIds.add(person.id);

        const children = personsData
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
          .map(child => buildPersonNode(child))
          .filter((node): node is TreeNode => node !== null);

        return {
          name: `${person.prenom} ${person.nom}`.trim() || `Personne ${person.id.slice(0, 8)}`,
          id: person.id,
          genre: person.genre,
          description: person.description || '',
          dateNaissance: person.dateNaissance || '',
          dateDeces: person.dateDeces,
          image: person.image,
          children: childNodes.length > 0 ? childNodes : undefined
        };
      };

      return roots
        .map(person => buildPersonNode(person))
        .filter((node): node is TreeNode => node !== null);
    };

    const roots = buildFamilyTree(persons);
    if (roots.length === 0) return null;

    if (roots.length === 1) {
      return roots[0];
    }

    if (roots.length === 0 && persons.length > 0) {
      const firstPerson = persons[0];
      return {
        name: `${firstPerson.prenom} ${firstPerson.nom}`.trim() || 'Racine',
        id: firstPerson.id,
        genre: firstPerson.genre,
        description: firstPerson.description,
        dateNaissance: firstPerson.dateNaissance,
        dateDeces: firstPerson.dateDeces,
        image: firstPerson.image,
        children: undefined
      };
    }

    return {
      name: 'Famille Racine',
      id: 'root',
      genre: 'homme' as const,
      description: 'Racine de l\'arbre généalogique',
      dateNaissance: '',
      dateDeces: null,
      image: null,
      children: roots
    };
  }, [persons]);

  return treeData;
}


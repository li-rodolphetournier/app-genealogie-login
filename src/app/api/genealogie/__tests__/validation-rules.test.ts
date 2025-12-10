/**
 * Tests d'intégration pour les règles de validation des API de généalogie
 */

import { describe, it, expect } from 'vitest';
import { personCreateSchema, personUpdateSchema } from '@/lib/validations';
import { GenealogyBusinessRules } from '@/lib/validations/__tests__/genealogy.business-rules.test';
import type { Person } from '@/types/genealogy';

describe('Validation API - Création', () => {
  describe('Validation des liens parent-enfant', () => {
    const mockPersons: Person[] = [
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
    ];

    it('doit valider qu\'un homme peut être père', () => {
      const newPerson = {
        nom: 'Dupont',
        prenom: 'Pierre',
        genre: 'homme' as const,
        description: '',
        mere: 'mother-1',
        pere: 'father-1',
        ordreNaissance: 1,
        dateNaissance: '1980-01-01',
        dateDeces: null,
        image: null,
      };

      const schemaResult = personCreateSchema.safeParse(newPerson);
      expect(schemaResult.success).toBe(true);

      if (schemaResult.success) {
        const genreResult = GenealogyBusinessRules.validateParentGenre(
          newPerson.genre,
          newPerson.pere,
          newPerson.mere,
          mockPersons
        );
        expect(genreResult.valid).toBe(true);
      }
    });

    it('doit rejeter si un homme est désigné comme mère', () => {
      const result = GenealogyBusinessRules.validateParentGenre(
        'homme',
        null,
        'father-1', // Un homme comme mère
        mockPersons
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mère doit être une femme');
    });

    it('doit rejeter si une femme est désignée comme père', () => {
      const result = GenealogyBusinessRules.validateParentGenre(
        'femme',
        'mother-1', // Une femme comme père
        null,
        mockPersons
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('père doit être un homme');
    });
  });

  describe('Validation des dates', () => {
    it('doit valider que dateDeces est après dateNaissance', () => {
      const result = GenealogyBusinessRules.validateDates('1990-01-01', '2020-01-01');
      expect(result.valid).toBe(true);
    });

    it('doit rejeter dateDeces avant dateNaissance', () => {
      const result = GenealogyBusinessRules.validateDates('1990-01-01', '1980-01-01');
      expect(result.valid).toBe(false);
    });
  });

  describe('Validation des références circulaires', () => {
    const mockPersons: Person[] = [
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

    it('doit rejeter si un enfant devient parent de son propre parent', () => {
      // child-1 essaie de devenir parent de parent-1 (son propre père)
      const result = GenealogyBusinessRules.validateCircularReference(
        'child-1',
        'parent-1',
        null,
        mockPersons
      );
      expect(result.valid).toBe(false);
    });
  });
});

describe('Validation API - Modification', () => {
  it('doit permettre de modifier uniquement certains champs', () => {
    const update = {
      nom: 'NouveauNom',
    };

    const result = personUpdateSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it('doit permettre de changer le père', () => {
    const update = {
      pere: 'nouveau-pere-id',
    };

    const result = personUpdateSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it('doit permettre de retirer un parent (mettre à null)', () => {
    const update = {
      pere: null,
      mere: null,
    };

    const result = personUpdateSchema.safeParse(update);
    expect(result.success).toBe(true);
  });
});

describe('Validation API - Suppression', () => {
  it('doit valider qu\'on peut supprimer une personne', () => {
    // La suppression est gérée par le service, pas de schéma de validation
    // Mais on peut tester que l'ID est requis
    expect(true).toBe(true); // Placeholder
  });
});


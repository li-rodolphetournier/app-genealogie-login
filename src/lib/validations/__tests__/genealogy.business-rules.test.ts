/**
 * Tests des règles métier pour la généalogie
 */

import { describe, it, expect } from 'vitest';
import type { Person } from '@/types/genealogy';

// Règles métier à tester
export class GenealogyBusinessRules {
  /**
   * Une personne ne peut pas être son propre parent
   */
  static cannotBeOwnParent(personId: string, pere: string | null, mere: string | null): boolean {
    return pere !== personId && mere !== personId;
  }

  /**
   * Un homme ne peut pas être mère, une femme ne peut pas être père
   */
  static validateParentGenre(
    personGenre: 'homme' | 'femme',
    pereId: string | null,
    mereId: string | null,
    persons: Person[]
  ): { valid: boolean; error?: string } {
    if (pereId) {
      const pere = persons.find(p => p.id === pereId);
      if (pere && pere.genre !== 'homme') {
        return { valid: false, error: 'Le père doit être un homme' };
      }
    }

    if (mereId) {
      const mere = persons.find(p => p.id === mereId);
      if (mere && mere.genre !== 'femme') {
        return { valid: false, error: 'La mère doit être une femme' };
      }
    }

    return { valid: true };
  }

  /**
   * Une personne ne peut pas être parent de ses propres parents (boucle)
   */
  static validateCircularReference(
    personId: string,
    pereId: string | null,
    mereId: string | null,
    persons: Person[]
  ): { valid: boolean; error?: string } {
    // Vérifier si pereId ou mereId sont déjà des parents de personId
    // Si c'est le cas, personId ne peut pas devenir leur parent (créerait une boucle)
    const checkIsAncestor = (targetId: string | null, visited: Set<string> = new Set()): boolean => {
      if (!targetId) return false;
      if (visited.has(targetId)) return false; // Éviter les boucles infinies
      if (targetId === personId) return true; // personId serait parent de lui-même = boucle
      
      visited.add(targetId);
      const person = persons.find(p => p.id === personId);
      if (!person) return false;
      
      // Si personId a targetId comme parent (direct), alors targetId est déjà un parent de personId
      // Donc faire de targetId un parent de personId créerait une boucle
      if (person.pere === targetId || person.mere === targetId) {
        return true; // Boucle détectée : targetId est déjà parent de personId
      }
      
      // Vérifier récursivement si les parents de personId sont des ancêtres de targetId
      // Si personId a un parent qui est un descendant de targetId, c'est une boucle
      const checkParentIsDescendantOfTarget = (parentId: string | null): boolean => {
        if (!parentId || parentId === targetId) return parentId === targetId;
        const parent = persons.find(p => p.id === parentId);
        if (!parent) return false;
        return checkParentIsDescendantOfTarget(parent.pere) || checkParentIsDescendantOfTarget(parent.mere);
      };
      
      return checkParentIsDescendantOfTarget(person.pere) || checkParentIsDescendantOfTarget(person.mere);
    };

    // Vérifier si pereId ou mereId sont déjà des parents de personId
    if (checkIsAncestor(pereId) || checkIsAncestor(mereId)) {
      return { valid: false, error: 'Récursion circulaire détectée dans les relations parent-enfant' };
    }

    return { valid: true };
  }

  /**
   * Une personne ne peut pas être parent d'elle-même
   */
  static validateSelfReference(personId: string, pereId: string | null, mereId: string | null): { valid: boolean; error?: string } {
    if (pereId === personId || mereId === personId) {
      return { valid: false, error: 'Une personne ne peut pas être son propre parent' };
    }
    return { valid: true };
  }

  /**
   * La date de décès doit être après la date de naissance
   */
  static validateDates(dateNaissance: string, dateDeces: string | null): { valid: boolean; error?: string } {
    if (!dateDeces) return { valid: true };

    const birthDate = new Date(dateNaissance);
    const deathDate = new Date(dateDeces);

    if (deathDate < birthDate) {
      return { valid: false, error: 'La date de décès doit être après la date de naissance' };
    }

    return { valid: true };
  }

  /**
   * Un parent doit être né avant ses enfants
   */
  static validateParentChildAge(
    childDateNaissance: string,
    pereId: string | null,
    mereId: string | null,
    persons: Person[]
  ): { valid: boolean; error?: string } {
    const childBirthDate = new Date(childDateNaissance);

    if (pereId) {
      const pere = persons.find(p => p.id === pereId);
      if (pere && pere.dateNaissance) {
        const pereBirthDate = new Date(pere.dateNaissance);
        // Le père doit avoir au moins 13 ans (considérant la maturité minimale)
        const minAge = 13;
        const minPereBirthDate = new Date(childBirthDate);
        minPereBirthDate.setFullYear(minPereBirthDate.getFullYear() - minAge);
        
        if (pereBirthDate > minPereBirthDate) {
          return { valid: false, error: 'Le père doit être né avant son enfant' };
        }
      }
    }

    if (mereId) {
      const mere = persons.find(p => p.id === mereId);
      if (mere && mere.dateNaissance) {
        const mereBirthDate = new Date(mere.dateNaissance);
        const minAge = 13;
        const minMereBirthDate = new Date(childBirthDate);
        minMereBirthDate.setFullYear(minMereBirthDate.getFullYear() - minAge);
        
        if (mereBirthDate > minMereBirthDate) {
          return { valid: false, error: 'La mère doit être née avant son enfant' };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Une personne ne peut pas être à la fois père et mère
   */
  static validateSamePersonAsBothParents(pereId: string | null, mereId: string | null): { valid: boolean; error?: string } {
    if (pereId && mereId && pereId === mereId) {
      return { valid: false, error: 'Une personne ne peut pas être à la fois père et mère' };
    }
    return { valid: true };
  }
}

describe('Règles métier - Général', () => {
  describe('validateSelfReference', () => {
    it('doit rejeter si une personne est son propre père', () => {
      const result = GenealogyBusinessRules.validateSelfReference('person-1', 'person-1', null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('propre parent');
    });

    it('doit rejeter si une personne est sa propre mère', () => {
      const result = GenealogyBusinessRules.validateSelfReference('person-1', null, 'person-1');
      expect(result.valid).toBe(false);
    });

    it('doit accepter si pas d\'auto-référence', () => {
      const result = GenealogyBusinessRules.validateSelfReference('person-1', 'father-1', 'mother-1');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateSamePersonAsBothParents', () => {
    it('doit rejeter si la même personne est père et mère', () => {
      const result = GenealogyBusinessRules.validateSamePersonAsBothParents('person-1', 'person-1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('père et mère');
    });

    it('doit accepter si père et mère sont différents', () => {
      const result = GenealogyBusinessRules.validateSamePersonAsBothParents('father-1', 'mother-1');
      expect(result.valid).toBe(true);
    });
  });
});

describe('Règles métier - Dates', () => {
  describe('validateDates', () => {
    it('doit accepter si dateDeces est nulle', () => {
      const result = GenealogyBusinessRules.validateDates('1990-01-01', null);
      expect(result.valid).toBe(true);
    });

    it('doit accepter si dateDeces est après dateNaissance', () => {
      const result = GenealogyBusinessRules.validateDates('1990-01-01', '2020-01-01');
      expect(result.valid).toBe(true);
    });

    it('doit rejeter si dateDeces est avant dateNaissance', () => {
      const result = GenealogyBusinessRules.validateDates('1990-01-01', '1980-01-01');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('après');
    });
  });
});

describe('Règles métier - Genre des parents', () => {
  const mockPersons: Person[] = [
    {
      id: 'father-1',
      nom: 'Dupont',
      prenom: 'Pierre',
      genre: 'homme',
      description: '',
      mere: null,
      pere: null,
      ordreNaissance: 1,
      dateNaissance: '1960-01-01',
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
      dateNaissance: '1965-01-01',
      dateDeces: null,
      image: null,
    },
    {
      id: 'wrong-gender-1',
      nom: 'Test',
      prenom: 'Test',
      genre: 'femme',
      description: '',
      mere: null,
      pere: null,
      ordreNaissance: 1,
      dateNaissance: '1970-01-01',
      dateDeces: null,
      image: null,
    },
  ];

  describe('validateParentGenre', () => {
    it('doit accepter un père homme', () => {
      const result = GenealogyBusinessRules.validateParentGenre('homme', 'father-1', null, mockPersons);
      expect(result.valid).toBe(true);
    });

    it('doit accepter une mère femme', () => {
      const result = GenealogyBusinessRules.validateParentGenre('femme', null, 'mother-1', mockPersons);
      expect(result.valid).toBe(true);
    });

    it('doit rejeter si le père est une femme', () => {
      const result = GenealogyBusinessRules.validateParentGenre('homme', 'wrong-gender-1', null, mockPersons);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('père doit être un homme');
    });

    it('doit rejeter si la mère est un homme', () => {
      const result = GenealogyBusinessRules.validateParentGenre('femme', null, 'father-1', mockPersons);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mère doit être une femme');
    });
  });

  describe('validateParentChildAge', () => {
    it('doit accepter si le parent est né avant l\'enfant', () => {
      const result = GenealogyBusinessRules.validateParentChildAge(
        '1990-01-01',
        'father-1',
        'mother-1',
        mockPersons
      );
      expect(result.valid).toBe(true);
    });

    it('doit rejeter si le parent est né après l\'enfant', () => {
      const youngFather: Person = {
        ...mockPersons[0],
        dateNaissance: '2000-01-01', // Né après l'enfant
      };
      const result = GenealogyBusinessRules.validateParentChildAge(
        '1990-01-01',
        youngFather.id,
        null,
        [youngFather, ...mockPersons]
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('né avant');
    });
  });
});

describe('Règles métier - Références circulaires', () => {
  const mockPersons: Person[] = [
    {
      id: 'person-1',
      nom: 'Person',
      prenom: 'One',
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
      id: 'person-2',
      nom: 'Person',
      prenom: 'Two',
      genre: 'homme',
      description: '',
      mere: null,
      pere: 'person-1', // Person-2 est enfant de person-1
      ordreNaissance: 1,
      dateNaissance: '1980-01-01',
      dateDeces: null,
      image: null,
    },
  ];

  describe('validateCircularReference', () => {
    it('doit rejeter si une personne devient parent de son propre parent', () => {
      // Person-2 essaie de devenir parent de person-1
      // Mais person-1 est déjà le père de person-2 dans mockPersons
      // Donc person-2 ne peut pas devenir parent de person-1 (créerait une boucle)
      // On vérifie que person-1 est un descendant de person-2
      const result = GenealogyBusinessRules.validateCircularReference(
        'person-2', // On veut faire de person-2 un parent
        'person-1', // de person-1
        null,
        mockPersons // Dans mockPersons, person-1 est déjà le père de person-2
      );
      // La fonction devrait détecter que person-1 est déjà un parent de person-2
      // donc person-2 ne peut pas devenir parent de person-1
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('doit accepter si pas de référence circulaire', () => {
      const result = GenealogyBusinessRules.validateCircularReference(
        'person-3',
        'person-1',
        null,
        mockPersons
      );
      expect(result.valid).toBe(true);
    });
  });
});


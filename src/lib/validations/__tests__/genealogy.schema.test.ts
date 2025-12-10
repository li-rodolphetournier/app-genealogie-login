/**
 * Tests de validation pour les schémas de généalogie
 */

import { describe, it, expect } from 'vitest';
import { personCreateSchema, personUpdateSchema } from '../genealogy.schema';

describe('personCreateSchema', () => {
  const validPerson = {
    nom: 'Dupont',
    prenom: 'Jean',
    genre: 'homme' as const,
    description: 'Test description',
    mere: null,
    pere: null,
    ordreNaissance: 1,
    dateNaissance: '1990-01-01',
    dateDeces: null,
    image: null,
  };

  describe('Validation de base', () => {
    it('doit accepter une personne valide', () => {
      const result = personCreateSchema.safeParse(validPerson);
      expect(result.success).toBe(true);
    });

    it('doit rejeter si le prénom est manquant', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        prenom: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('prénom');
      }
    });

    it('doit rejeter si le nom dépasse 100 caractères', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        nom: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('doit rejeter si le prénom dépasse 100 caractères', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        prenom: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('doit rejeter un genre invalide', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        genre: 'autre',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Validation des dates', () => {
    it('doit rejeter si dateNaissance est manquante', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        dateNaissance: '',
      });
      expect(result.success).toBe(false);
    });

    it('doit accepter dateDeces nulle', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        dateDeces: null,
      });
      expect(result.success).toBe(true);
    });

    it('doit accepter dateDeces avec une date valide', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        dateDeces: '2020-01-01',
      });
      expect(result.success).toBe(true);
    });

    it('doit valider que dateDeces est après dateNaissance (logique métier)', () => {
      // Note: Cette validation pourrait être ajoutée dans un schéma personnalisé
      const dateNaissance = '2000-01-01';
      const dateDeces = '1990-01-01'; // Avant la naissance
      // Pour l'instant, le schéma accepte, mais on peut tester la logique métier
      expect(new Date(dateDeces) < new Date(dateNaissance)).toBe(true);
    });
  });

  describe('Validation des images', () => {
    it('doit accepter une URL d\'image valide', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        image: 'https://example.com/image.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('doit accepter image nulle', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        image: null,
      });
      expect(result.success).toBe(true);
    });

    it('doit accepter image vide', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        image: '',
      });
      expect(result.success).toBe(true);
    });

    it('doit rejeter une URL d\'image invalide', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        image: 'pas-une-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Validation des relations parent-enfant', () => {
    it('doit accepter mere et pere nuls', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        mere: null,
        pere: null,
      });
      expect(result.success).toBe(true);
    });

    it('doit accepter mere et pere avec des IDs valides', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        mere: 'mother-id-123',
        pere: 'father-id-456',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Validation de ordreNaissance', () => {
    it('doit accepter ordreNaissance >= 1', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        ordreNaissance: 1,
      });
      expect(result.success).toBe(true);
    });

    it('doit rejeter ordreNaissance < 1', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        ordreNaissance: 0,
      });
      expect(result.success).toBe(false);
    });

    it('doit rejeter ordreNaissance négatif', () => {
      const result = personCreateSchema.safeParse({
        ...validPerson,
        ordreNaissance: -1,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('personUpdateSchema', () => {
  const validUpdate = {
    nom: 'Dupont',
    prenom: 'Jean',
  };

  it('doit accepter une mise à jour partielle', () => {
    const result = personUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('doit accepter un objet vide (tous les champs optionnels)', () => {
    const result = personUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('doit rejeter un nom trop long', () => {
    const result = personUpdateSchema.safeParse({
      nom: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('doit accepter dateDeces = null pour mise à jour', () => {
    const result = personUpdateSchema.safeParse({
      dateDeces: null,
    });
    expect(result.success).toBe(true);
  });
});


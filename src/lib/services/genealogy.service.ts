/**
 * Service pour la gestion de la généalogie
 * Couche d'accès aux données (DAL) - Utilise Supabase
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Person } from '@/types/genealogy';

export class GenealogyService {
  /**
   * Récupérer toutes les personnes
   */
  static async findAll(): Promise<Person[]> {
    const supabase = await createServiceRoleClient();
    const { data: persons, error } = await supabase
      .from('persons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des personnes: ${error.message}`);
    }

    return (persons || []).map((p: any) => ({
      id: p.id,
      nom: p.nom,
      prenom: p.prenom,
      genre: p.genre as Person['genre'],
      description: p.description || '',
      mere: p.mere_id || null,
      pere: p.pere_id || null,
      ordreNaissance: p.ordre_naissance || 1,
      dateNaissance: p.date_naissance || '',
      dateDeces: p.date_deces || null,
      image: p.image || null,
    }));
  }

  /**
   * Récupérer une personne par ID
   */
  static async findById(id: string): Promise<Person | null> {
    const supabase = await createServiceRoleClient();
    const { data: person, error } = await supabase
      .from('persons')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !person) {
      return null;
    }

    return {
      id: person.id,
      nom: person.nom,
      prenom: person.prenom,
      genre: person.genre as Person['genre'],
      description: person.description || '',
      mere: person.mere_id || null,
      pere: person.pere_id || null,
      ordreNaissance: person.ordre_naissance || 1,
      dateNaissance: person.date_naissance || '',
      dateDeces: person.date_deces || null,
      image: person.image || null,
    };
  }

  /**
   * Créer une personne
   */
  static async create(person: Person): Promise<Person> {
    const supabase = await createServiceRoleClient();

    const { data: newPerson, error } = await supabase
      .from('persons')
      .insert({
        id: person.id,
        nom: person.nom,
        prenom: person.prenom,
        genre: person.genre,
        description: person.description || '',
        detail: null,
        mere_id: person.mere || null,
        pere_id: person.pere || null,
        ordre_naissance: person.ordreNaissance || 1,
        date_naissance: person.dateNaissance || null,
        date_deces: person.dateDeces || null,
        image: person.image || null,
      })
      .select()
      .single();

    if (error || !newPerson) {
      throw new Error(`Erreur lors de la création: ${error?.message || 'Erreur inconnue'}`);
    }

    return {
      id: newPerson.id,
      nom: newPerson.nom,
      prenom: newPerson.prenom,
      genre: newPerson.genre as Person['genre'],
      description: newPerson.description || '',
      mere: newPerson.mere_id || null,
      pere: newPerson.pere_id || null,
      ordreNaissance: newPerson.ordre_naissance || 1,
      dateNaissance: newPerson.date_naissance || '',
      dateDeces: newPerson.date_deces || null,
      image: newPerson.image || null,
    };
  }

  /**
   * Mettre à jour une personne
   */
  static async update(id: string, person: Partial<Person>): Promise<Person> {
    const supabase = await createServiceRoleClient();

    const updateFields: Record<string, any> = {};
    if (person.nom !== undefined) updateFields.nom = person.nom;
    if (person.prenom !== undefined) updateFields.prenom = person.prenom;
    if (person.genre !== undefined) updateFields.genre = person.genre;
    if (person.description !== undefined) updateFields.description = person.description || '';
    if (person.mere !== undefined) updateFields.mere_id = person.mere || null;
    if (person.pere !== undefined) updateFields.pere_id = person.pere || null;
    if (person.ordreNaissance !== undefined) updateFields.ordre_naissance = person.ordreNaissance;
    if (person.dateNaissance !== undefined) updateFields.date_naissance = person.dateNaissance || null;
    if (person.dateDeces !== undefined) updateFields.date_deces = person.dateDeces || null;
    if (person.image !== undefined) updateFields.image = person.image || null;

    const { error } = await supabase
      .from('persons')
      .update(updateFields)
      .eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Erreur lors de la récupération de la personne mise à jour');
    }

    return updated;
  }

  /**
   * Supprimer une personne
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createServiceRoleClient();
    const { error } = await supabase.from('persons').delete().eq('id', id);
    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
  }
}

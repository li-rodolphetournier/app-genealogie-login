/**
 * Service pour la gestion de la généalogie
 * Couche d'accès aux données (DAL)
 */

import fs from 'fs/promises';
import path from 'path';
import type { Person } from '@/types/genealogy';

const genealogiePath = path.join(process.cwd(), 'src/data/genealogie.json');

async function readPersons(): Promise<Person[]> {
  try {
    const data = await fs.readFile(genealogiePath, 'utf-8');
    return JSON.parse(data) as Person[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writePersons(persons: Person[]): Promise<void> {
  await fs.writeFile(genealogiePath, JSON.stringify(persons, null, 2), 'utf-8');
}

export class GenealogyService {
  /**
   * Récupérer toutes les personnes
   */
  static async findAll(): Promise<Person[]> {
    return await readPersons();
  }

  /**
   * Récupérer une personne par ID
   */
  static async findById(id: string): Promise<Person | null> {
    const persons = await readPersons();
    return persons.find(p => p.id === id) || null;
  }

  /**
   * Créer une personne
   */
  static async create(person: Person): Promise<Person> {
    const persons = await readPersons();

    // Vérifier si la personne existe déjà
    const existingPerson = persons.find(p => p.id === person.id);
    if (existingPerson) {
      throw new Error('Une personne avec cet ID existe déjà');
    }

    persons.push(person);
    await writePersons(persons);

    return person;
  }

  /**
   * Mettre à jour une personne
   */
  static async update(id: string, person: Partial<Person>): Promise<Person> {
    const persons = await readPersons();
    const personIndex = persons.findIndex(p => p.id === id);

    if (personIndex === -1) {
      throw new Error('Personne non trouvée');
    }

    const updatedPerson: Person = {
      ...persons[personIndex],
      ...person,
      id, // Garantir que l'ID ne change pas
    };

    persons[personIndex] = updatedPerson;
    await writePersons(persons);

    return updatedPerson;
  }

  /**
   * Supprimer une personne
   */
  static async delete(id: string): Promise<void> {
    const persons = await readPersons();
    const filteredPersons = persons.filter(p => p.id !== id);

    if (persons.length === filteredPersons.length) {
      throw new Error('Personne non trouvée');
    }

    await writePersons(filteredPersons);
  }
}


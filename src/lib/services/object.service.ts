/**
 * Service pour la gestion des objets
 * Couche d'accès aux données (DAL)
 */

import fs from 'fs/promises';
import path from 'path';
import type { ObjectData, ObjectCreateInput, ObjectUpdateInput } from '@/types/objects';

const objectsPath = path.join(process.cwd(), 'src/data/objects.json');

async function readObjects(): Promise<ObjectData[]> {
  try {
    const data = await fs.readFile(objectsPath, 'utf-8');
    return JSON.parse(data) as ObjectData[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeObjects(objects: ObjectData[]): Promise<void> {
  await fs.writeFile(objectsPath, JSON.stringify(objects, null, 2), 'utf-8');
}

export class ObjectService {
  /**
   * Récupérer tous les objets
   */
  static async findAll(): Promise<ObjectData[]> {
    return await readObjects();
  }

  /**
   * Récupérer un objet par ID
   */
  static async findById(id: string): Promise<ObjectData | null> {
    const objects = await readObjects();
    return objects.find(obj => obj.id === id) || null;
  }

  /**
   * Créer un objet
   */
  static async create(input: ObjectCreateInput): Promise<ObjectData> {
    const objects = await readObjects();

    const newObject: ObjectData = {
      id: Date.now().toString(),
      nom: input.nom,
      type: input.type,
      status: input.status,
      utilisateur: input.utilisateur,
      description: input.description,
      longDescription: input.longDescription,
      photos: input.photos || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    objects.push(newObject);
    await writeObjects(objects);

    return newObject;
  }

  /**
   * Mettre à jour un objet
   */
  static async update(id: string, input: ObjectUpdateInput): Promise<ObjectData> {
    const objects = await readObjects();
    const objectIndex = objects.findIndex(obj => obj.id === id);

    if (objectIndex === -1) {
      throw new Error('Objet non trouvé');
    }

    const updatedObject: ObjectData = {
      ...objects[objectIndex],
      ...input,
      id, // Garantir que l'ID ne change pas
      updatedAt: new Date().toISOString(),
    };

    objects[objectIndex] = updatedObject;
    await writeObjects(objects);

    return updatedObject;
  }

  /**
   * Supprimer un objet
   */
  static async delete(id: string): Promise<void> {
    const objects = await readObjects();
    const filteredObjects = objects.filter(obj => obj.id !== id);

    if (objects.length === filteredObjects.length) {
      throw new Error('Objet non trouvé');
    }

    await writeObjects(filteredObjects);
  }
}


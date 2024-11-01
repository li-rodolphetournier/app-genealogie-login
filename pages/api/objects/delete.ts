import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface ObjectImage {
  url: string;
  description: string[];
}

interface ObjectData {
  id: string;
  nom: string;
  type: string;
  description?: string;
  status: 'publie' | 'brouillon';
  utilisateur: string;
  images?: string[];
  photos?: ObjectImage[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query;

  try {
    const dataFilePath = path.join(process.cwd(), 'src/data/objects.json');
    const jsonData = fs.readFileSync(dataFilePath, 'utf8');
    const objects = JSON.parse(jsonData) as ObjectData[];

    const objectIndex = objects.findIndex((obj: ObjectData) => obj.id === id);

    if (objectIndex === -1) {
      return res.status(404).json({ message: 'Object not found' });
    }

    // Supprimer l'objet du tableau
    objects.splice(objectIndex, 1);

    // Sauvegarder le tableau mis à jour
    fs.writeFileSync(dataFilePath, JSON.stringify(objects, null, 2));

    return res.status(200).json({ message: 'Object deleted successfully' });
  } catch (error) {
    console.error('Error deleting object:', error);
    return res.status(500).json({ message: 'Error deleting object' });
  }
}

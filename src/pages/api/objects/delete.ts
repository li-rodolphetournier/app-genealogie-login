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
  utilisateur: string;
  status: 'publie' | 'brouillon' | 'disponible' | 'indisponible';
  images?: ObjectImage[];
  photos?: ObjectImage[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  try {
    const dataFilePath = path.join(process.cwd(), 'src/data/objects.json');
    const jsonData = fs.readFileSync(dataFilePath, 'utf8');
    const objects = JSON.parse(jsonData) as ObjectData[];

    const objectIndex = objects.findIndex((obj: ObjectData) => obj.id === id);

    if (objectIndex === -1) {
      return res.status(404).json({ message: 'Object not found' });
    }

    const objectToDelete = objects[objectIndex];

    // Supprimer les fichiers d'image associés
    if (Array.isArray(objectToDelete.images)) {
      objectToDelete.images.forEach((image: ObjectImage) => {
        const imagePath = path.join(process.cwd(), 'public', image.url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    // Gérer aussi les photos si elles existent
    if (Array.isArray(objectToDelete.photos)) {
      objectToDelete.photos.forEach((photo: ObjectImage) => {
        const photoPath = path.join(process.cwd(), 'public', photo.url);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      });
    }

    // Supprimer l'objet du tableau
    objects.splice(objectIndex, 1);

    // Écrire le tableau mis à jour dans le fichier JSON
    fs.writeFileSync(dataFilePath, JSON.stringify(objects, null, 2));

    res.status(200).json({ message: 'Object deleted successfully' });
  } catch (error) {
    console.error('Error deleting object:', error);
    res.status(500).json({ 
      message: 'Error deleting object', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

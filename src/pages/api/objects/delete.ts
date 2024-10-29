import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

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
    let objects = JSON.parse(jsonData);

    const objectIndex = objects.findIndex((obj: any) => obj.id === id);

    if (objectIndex === -1) {
      return res.status(404).json({ message: 'Object not found' });
    }

    const objectToDelete = objects[objectIndex];

    // Supprimer les fichiers d'image associés
    if (Array.isArray(objectToDelete.images)) {
      objectToDelete.images.forEach((image: any) => {
        const imagePath = path.join(process.cwd(), 'public', image.url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
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
    res.status(500).json({ message: 'Error deleting object', error: (error as Error).message });
  }
}

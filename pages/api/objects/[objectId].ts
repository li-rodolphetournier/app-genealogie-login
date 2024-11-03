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
  const { objectId } = req.query;
  const objectsPath = path.join(process.cwd(), 'src/data/objects.json');

  try {
    // Lecture du fichier JSON
    const jsonData = fs.readFileSync(objectsPath, 'utf8');
    const objects = JSON.parse(jsonData);

    switch (req.method) {
      case 'GET':
        const object = objects.find((obj: any) => obj.id === objectId);
        if (!object) {
          return res.status(404).json({ message: 'Objet non trouvé' });
        }
        return res.status(200).json(object);

      case 'PUT':
        const updatedObjectIndex = objects.findIndex((obj: any) => obj.id === objectId);
        if (updatedObjectIndex === -1) {
          return res.status(404).json({ message: 'Objet non trouvé' });
        }

        // Mise à jour de l'objet en conservant les champs non modifiés
        const updatedObject = {
          ...objects[updatedObjectIndex],
          ...req.body,
          id: objectId // Garantit que l'ID ne change pas
        };

        objects[updatedObjectIndex] = updatedObject;

        // Écriture des modifications dans le fichier
        fs.writeFileSync(objectsPath, JSON.stringify(objects, null, 2));

        return res.status(200).json(updatedObject);

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error handling object:', error);
    return res.status(500).json({ message: 'Erreur serveur interne' });
  }
}

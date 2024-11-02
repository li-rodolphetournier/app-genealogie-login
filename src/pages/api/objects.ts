import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { ObjectData } from '@/types/objects';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const dataFilePath = path.join(process.cwd(), 'src/data/objects.json');
      const jsonData = fs.readFileSync(dataFilePath, 'utf8');
      const objects = JSON.parse(jsonData);
      
      res.status(200).json(objects);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération des objets' });
    }
  } else if (req.method === 'POST') {
    try {
      const body = req.body;
      const newObject: ObjectData = {
        id: Date.now().toString(),
        nom: body.nom,
        type: body.type,
        description: body.description,
        status: body.status as 'publie' | 'brouillon',
        utilisateur: body.utilisateur,
        photos: body.photos || []
      };
      
      res.status(200).json(newObject);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la création d\'un nouvel objet' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

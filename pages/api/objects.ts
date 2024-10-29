import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const objectsPath = path.join(process.cwd(), 'src/data/objects.json');
      const objectsData = JSON.parse(fs.readFileSync(objectsPath, 'utf8'));
      res.status(200).json(objectsData);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier objects.json:', error);
      res.status(500).json({ message: 'Erreur serveur lors de la récupération des objets' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

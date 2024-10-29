import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      const objectsPath = path.join(process.cwd(), 'src/data/objects.json');
      const objectsData = JSON.parse(fs.readFileSync(objectsPath, 'utf8'));

      const object = objectsData.find((obj: any) => obj.id === id);

      if (object) {
        res.status(200).json(object);
      } else {
        res.status(404).json({ message: 'Object not found' });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'objet:', error);
      res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'objet' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

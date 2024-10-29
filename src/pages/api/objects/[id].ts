import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      const dataFilePath = path.join(process.cwd(), 'src/data/objects.json');
      const jsonData = fs.readFileSync(dataFilePath, 'utf8');
      const objects = JSON.parse(jsonData);
      
      const object = objects.find((obj: any) => obj.id === id);
      
      if (object) {
        res.status(200).json(object);
      } else {
        res.status(404).json({ message: 'Objet non trouvé' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération de l\'objet' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const dataFilePath = path.join(process.cwd(), 'src/data/objects.json');
      const jsonData = fs.readFileSync(dataFilePath, 'utf8');
      const objects = JSON.parse(jsonData);
      
      res.status(200).json(objects);
    } catch (err) {
      console.error('Erreur lors de la lecture:', err);
      return res.status(500).json({ error: 'Erreur lors de la lecture des objets' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

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

  if (req.method === 'GET') {
    try {
      const dataFilePath = path.join(process.cwd(), 'src/data/objects.json');
      const jsonData = fs.readFileSync(dataFilePath, 'utf8');
      const objects = JSON.parse(jsonData) as ObjectData[];

      const object = objects.find((obj: ObjectData) => obj.id === objectId);

      if (!object) {
        return res.status(404).json({ message: 'Object not found' });
      }

      return res.status(200).json(object);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ message: 'Error retrieving object' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

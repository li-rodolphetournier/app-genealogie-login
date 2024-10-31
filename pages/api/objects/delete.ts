import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const objectsPath = path.join(process.cwd(), 'src/data/objects.json');
      const objectsData = JSON.parse(fs.readFileSync(objectsPath, 'utf8'));

      const objectIndex = objectsData.findIndex((obj: any) => obj.id === id);

      if (objectIndex === -1) {
        return res.status(404).json({ message: 'Object not found' });
      }

      objectsData.splice(objectIndex, 1);
      fs.writeFileSync(objectsPath, JSON.stringify(objectsData, null, 2));

      res.status(200).json({ message: 'Object deleted successfully' });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'objet:', error);
      res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'objet' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

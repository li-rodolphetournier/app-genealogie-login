import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const objectsPath = path.join(process.cwd(), 'src/data/objects.json');
      const objectsData = JSON.parse(fs.readFileSync(objectsPath, 'utf8'));
      const object = objectsData.find((obj: any) => obj.id === id);

      if (object) {
        res.status(200).json(object);
      } else {
        res.status(404).json({ message: 'Objet non trouvé' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    try {
      const objectsPath = path.join(process.cwd(), 'src/data/objects.json');
      let objectsData = JSON.parse(fs.readFileSync(objectsPath, 'utf8'));
      
      const updatedObject = req.body;
      objectsData = objectsData.map((obj: any) => 
        obj.id === id ? updatedObject : obj
      );

      fs.writeFileSync(objectsPath, JSON.stringify(objectsData, null, 2));
      res.status(200).json({ message: 'Objet mis à jour avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

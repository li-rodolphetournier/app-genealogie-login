import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const newObject = req.body;
      const objectsPath = path.join(process.cwd(), 'src/data/objects.json');
      const objectsData = JSON.parse(fs.readFileSync(objectsPath, 'utf8'));

      // Générer un nouvel ID unique
      newObject.id = Date.now().toString();

      // Ajouter le nouvel objet à la liste
      objectsData.push(newObject);

      // Écrire les données mises à jour dans le fichier
      fs.writeFileSync(objectsPath, JSON.stringify(objectsData, null, 2));

      res.status(201).json(newObject);
    } catch (error) {
      console.error('Erreur lors de la création de l\'objet:', error);
      res.status(500).json({ message: 'Erreur serveur lors de la création de l\'objet' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

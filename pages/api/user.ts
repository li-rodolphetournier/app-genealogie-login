/* eslint-disable @typescript-eslint/explicit-function-return-type */
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Ici, nous supposons que vous avez un fichier JSON pour stocker les données utilisateur
      // Vous devrez adapter cela en fonction de votre système de stockage réel (base de données, etc.)
      const usersPath = path.join(process.cwd(), 'src/data/users.json');
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

      // Pour cet exemple, nous renvoyons simplement le premier utilisateur
      // Dans une application réelle, vous devriez identifier l'utilisateur connecté
      const user = usersData[0];

      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      res.status(500).json({ message: 'Erreur serveur lors de la récupération des données utilisateur' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      console.log('Données reçues:', req.body);
      const newUser = req.body;
      const usersPath = path.join(process.cwd(), 'src/data/users.json');
      console.log('Chemin du fichier users.json:', usersPath);
      
      let usersData;
      try {
        usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        console.log('Données utilisateurs existantes:', usersData);
      } catch (readError) {
        console.error('Erreur lors de la lecture du fichier users.json:', readError);
        return res.status(500).json({ message: 'Erreur lors de la lecture des données utilisateurs' });
      }

      // Vérifier si le login existe déjà
      if (usersData.some((user: any) => user.login === newUser.login)) {
        return res.status(400).json({ message: 'Ce login est déjà utilisé' });
      }

      // Ajouter le nouvel utilisateur à la liste
      usersData.push(newUser);

      // Écrire les données mises à jour dans le fichier
      fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));

      res.status(201).json(newUser);
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      res.status(500).json({ message: 'Erreur serveur lors de la création de l\'utilisateur', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

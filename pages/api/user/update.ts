import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    try {
      const { email, description, profileImage } = req.body;

      // Ici, nous supposons que vous avez un fichier JSON pour stocker les données utilisateur
      // Vous devrez adapter cela en fonction de votre système de stockage réel (base de données, etc.)
      const usersPath = path.join(process.cwd(), 'src/data/users.json');
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

      // Pour cet exemple, nous mettons à jour simplement le premier utilisateur
      // Dans une application réelle, vous devriez identifier l'utilisateur connecté
      usersData[0] = {
        ...usersData[0],
        email,
        description,
        profileImage,
      };

      fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));

      res.status(200).json({ message: 'Profil mis à jour avec succès' });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du profil' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

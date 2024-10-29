import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const usersPath = path.join(process.cwd(), 'src/data/users.json');
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      
      // Retirer les mots de passe avant d'envoyer les données
      const sanitizedUsers = usersData.map((user: any) => ({
        login: user.login,
        email: user.email,
        description: user.description,
        profileImage: user.profileImage,
        status: user.status
      }));

      res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier users.json:', error);
      res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

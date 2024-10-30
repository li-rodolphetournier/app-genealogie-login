import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { login } = req.query;

  try {
    const usersPath = path.join(process.cwd(), 'src/data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    if (req.method === 'GET') {
      const user = users.find((u: any) => u.login === login);
      
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
    } else if (req.method === 'PUT') {
      const updatedUsers = users.map((u: any) => 
        u.login === login ? { ...u, ...req.body, login } : u
      );
      
      fs.writeFileSync(usersPath, JSON.stringify(updatedUsers, null, 2));
      res.status(200).json({ message: 'Utilisateur mis à jour avec succès' });
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
} 
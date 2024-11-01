import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface User {
  id: string;
  login: string;
  password: string;
  status: 'administrateur' | 'utilisateur';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { login, password } = req.body as { login: string; password: string };
    const dataFilePath = path.join(process.cwd(), 'src/data/users.json');
    const jsonData = fs.readFileSync(dataFilePath, 'utf8');
    const users = JSON.parse(jsonData) as User[];

    const user = users.find(u => u.login === login && u.password === password);
    
    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    // Omettre le mot de passe de la réponse
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
} 
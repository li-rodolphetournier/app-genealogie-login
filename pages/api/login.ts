/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { login, password } = req.body;

    // Lire le fichier users.json
    const usersPath = path.join(process.cwd(), 'src/data/users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    // Trouver l'utilisateur
    const user = users.find((u: any) => 
      u.login === login && u.password === password
    );

    if (user) {
      // Ne pas renvoyer le mot de passe
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({ 
        message: 'Connexion réussie',
        user: userWithoutPassword 
      });
    } else {
      res.status(401).json({ message: 'Identifiants incorrects' });
    }
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
} 
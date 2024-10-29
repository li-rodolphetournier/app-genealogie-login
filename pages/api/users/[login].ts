import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { login } = req.query;

  if (req.method === 'GET') {
    try {
      const usersPath = path.join(process.cwd(), 'src/data/users.json');
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const user = users.find((u: any) => u.login === login);

      if (user) {
        // Ne pas renvoyer le mot de passe
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      } else {
        res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  } else if (req.method === 'PUT') {
    try {
      const usersPath = path.join(process.cwd(), 'src/data/users.json');
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      const userIndex = users.findIndex((u: any) => u.login === login);

      if (userIndex === -1) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Mettre à jour l'utilisateur en conservant son mot de passe
      users[userIndex] = {
        ...users[userIndex],
        ...req.body,
        login: users[userIndex].login, // Empêcher la modification du login
        password: users[userIndex].password, // Conserver le mot de passe existant
      };

      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      res.status(200).json({ message: 'Utilisateur mis à jour avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
} 
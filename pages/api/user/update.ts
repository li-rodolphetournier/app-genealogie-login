import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  try {
    const usersPath = path.join(process.cwd(), 'src/data/users.json');
    const jsonData = fs.readFileSync(usersPath, 'utf8');
    const users = JSON.parse(jsonData);
    const { login, ...updateData } = req.body;

    const userIndex = users.findIndex((user: any) => user.login === login);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    users[userIndex] = { ...users[userIndex], ...updateData };
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    return res.status(200).json(users[userIndex]);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Erreur serveur interne' });
  }
}

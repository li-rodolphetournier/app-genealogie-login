import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface UserData {
  id: string;
  login: string;
  password?: string;
  status: 'administrateur' | 'utilisateur';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const updatedUser: UserData = req.body;
    const dataFilePath = path.join(process.cwd(), 'src/data/users.json');
    
    let users = [];
    if (fs.existsSync(dataFilePath)) {
      const jsonData = fs.readFileSync(dataFilePath, 'utf8');
      users = JSON.parse(jsonData);
    }

    const userIndex = users.findIndex((u: any) => u.email === updatedUser.email);
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
    } else {
      users.push(updatedUser);
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2));

    res.status(200).json({ message: 'Utilisateur mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
}

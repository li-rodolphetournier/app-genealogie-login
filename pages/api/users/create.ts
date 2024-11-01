import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface User {
  id: string;
  login: string;
  password: string;
  status: 'administrateur' | 'utilisateur';
  email?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { login, password: userPassword, status, email } = req.body as User;

    // Vérifier que les champs requis sont présents
    if (!login || !userPassword || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const dataFilePath = path.join(process.cwd(), 'src/data/users.json');
    let users: User[] = [];

    // Lire le fichier existant
    if (fs.existsSync(dataFilePath)) {
      const jsonData = fs.readFileSync(dataFilePath, 'utf8');
      users = JSON.parse(jsonData);
    }

    // Vérifier si l'utilisateur existe déjà
    const userExists = users.some(user => user.login === login);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Créer le nouvel utilisateur
    const newUser: User = {
      id: Date.now().toString(),
      login,
      password: userPassword,
      status,
      ...(email && { email }) // Ajouter email seulement s'il existe
    };

    // Ajouter l'utilisateur et sauvegarder
    users.push(newUser);
    fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2));

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = newUser;
    return res.status(201).json(userWithoutPassword);

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ 
      message: 'Error creating user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

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
  const { login } = req.query;

  if (req.method === 'GET') {
    try {
      const dataFilePath = path.join(process.cwd(), 'src/data/users.json');
      const jsonData = fs.readFileSync(dataFilePath, 'utf8');
      const users = JSON.parse(jsonData) as User[];

      const user = users.find((u: User) => u.login === login);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ message: 'Error retrieving user' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
} 
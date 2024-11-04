import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface User {
  id: string;
  login: string;
  password: string;
  status: 'administrateur' | 'utilisateur';
  email?: string;
  profileImage?: string;
  description?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { login } = req.query;
  const usersPath = path.join(process.cwd(), 'src/data/users.json');

  try {
    const jsonData = fs.readFileSync(usersPath, 'utf8');
    const users = JSON.parse(jsonData);

    switch (req.method) {
      case 'GET':
        const user = users.find((u: any) => u.login === login);
        if (!user) {
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        return res.status(200).json(user);

      case 'PUT':
        const form = formidable({
          uploadDir: path.join(process.cwd(), 'public/uploads/users'),
          keepExtensions: true,
          filename: (name, ext) => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`,
        });

        const uploadDir = path.join(process.cwd(), 'public/uploads/users');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const [fields, files] = await form.parse(req);
        const userIndex = users.findIndex((u: any) => u.login === login);
        
        if (userIndex === -1) {
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const updatedUser = {
          ...users[userIndex],
          ...Object.keys(fields).reduce((acc, key) => ({
            ...acc,
            [key]: fields[key] && fields[key].length > 0 ? fields[key][0] : users[userIndex][key]
          }), {}),
          login
        };

        if (files.profileImage) {
          const profileImage = Array.isArray(files.profileImage) ? files.profileImage[0] : files.profileImage;
          
          if (users[userIndex].profileImage) {
            const oldImagePath = path.join(process.cwd(), 'public', users[userIndex].profileImage);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }

          updatedUser.profileImage = `/uploads/users/${path.basename(profileImage.filepath)}`;
        }

        users[userIndex] = updatedUser;
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

        return res.status(200).json(updatedUser);

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error handling user:', error);
    return res.status(500).json({ message: 'Erreur serveur interne' });
  }
} 
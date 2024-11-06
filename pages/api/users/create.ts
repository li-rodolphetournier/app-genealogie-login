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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  try {
    // Utiliser /tmp pour le stockage temporaire sur Vercel
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    const [fields, files] = await form.parse(req);

    // Vérifier si l'utilisateur existe déjà
    const usersPath = path.join(process.cwd(), 'src/data/users.json');
    let users: User[] = [];

    try {
      const jsonData = fs.readFileSync(usersPath, 'utf8');
      users = JSON.parse(jsonData);
    } catch (error) {
      console.warn('Fichier users.json non trouvé ou invalide, création d\'un nouveau fichier');
    }

    const existingUser = users.find(u => u.login === fields.login?.[0]);
    if (existingUser) {
      return res.status(400).json({ message: 'Cet identifiant est déjà utilisé' });
    }

    // Créer le nouvel utilisateur
    const newUser: User = {
      id: Date.now().toString(),
      login: fields.login?.[0] || '',
      password: fields.password?.[0] || '',
      status: (fields.status?.[0] as 'administrateur' | 'utilisateur') || 'utilisateur',
      email: fields.email?.[0],
      description: fields.description?.[0],
    };

    // Gérer l'upload de l'image de profil
    if (files.profileImage) {
      const file = Array.isArray(files.profileImage) ? files.profileImage[0] : files.profileImage;
      const uploadDir = path.join(process.cwd(), 'public/uploads/users');
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Déplacer le fichier du dossier temporaire vers le dossier final
      const finalPath = path.join(uploadDir, file.newFilename);
      await fs.promises.rename(file.filepath, finalPath);
      
      newUser.profileImage = `/uploads/users/${file.newFilename}`;
    }

    // Ajouter l'utilisateur et sauvegarder
    users.push(newUser);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

    // Retourner la réponse sans le mot de passe
    const { password, ...userWithoutPassword } = newUser;
    return res.status(201).json(userWithoutPassword);

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return res.status(500).json({ 
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}

import formidable from 'formidable';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface UserData {
  id: string;
  nom: string;
  email: string;
  profilePictureUrl?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const form = formidable({
    multiples: false,
    maxFileSize: 5 * 1024 * 1024,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Erreur lors du traitement du formulaire:', err);
      return res.status(500).json({ message: `Erreur lors du traitement du formulaire: ${err.message}` });
    }

    try {
      let profilePictureUrl: string | undefined;

      if (files.profilePicture) {
        const file = Array.isArray(files.profilePicture) ? files.profilePicture[0] : files.profilePicture as formidable.File;

        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          return res.status(500).json({ message: 'Token d\'authentification manquant pour Vercel Blob.' });
        }

        const fileBuffer = fs.readFileSync(file.filepath);
        const blob = await put(file.originalFilename as string, fileBuffer, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        profilePictureUrl = blob.url;
        console.log('Image de profil téléchargée avec succès:', profilePictureUrl);
      }

      const newUser: UserData = {
        id: Date.now().toString(),
        nom: fields.nom as unknown as string,
        email: fields.email as unknown as string,
        profilePictureUrl: profilePictureUrl as string | undefined,
      };

      const dataFilePath = path.join(process.cwd(), 'src/data/users.json');
      let users = [];
      try {
        const jsonData = fs.readFileSync(dataFilePath, 'utf8');
        users = JSON.parse(jsonData);
      } catch (error) {
        console.warn('Le fichier JSON était vide ou invalide. Création d\'un nouveau tableau.');
      }

      if (!Array.isArray(users)) {
        users = [];
      }

      users.push(newUser);
      fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2));

      res.status(200).json({ message: 'Utilisateur ajouté avec succès', user: newUser });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
      res.status(500).json({ message: `Erreur lors de l'ajout de l'utilisateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` });
    }
  });
}

import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const uploadDir = path.join(process.cwd(), 'public/uploads/profiles');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Erreur lors du traitement du formulaire:', err);
      return res.status(500).json({ message: `Erreur lors du traitement du formulaire: ${err.message}` });
    }

    try {
      const file = files.image as formidable.File;
      if (!file) {
        return res.status(400).json({ message: 'Aucune image n\'a été uploadée' });
      }

      const imageUrl = `/uploads/profiles/${file.newFilename}`;
      console.log('Image uploadée:', imageUrl); // Log pour déboguer
      res.status(200).json({ imageUrl });
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image de profil:', error);
      res.status(500).json({ message: `Erreur lors de l'upload de l'image de profil: ${error instanceof Error ? error.message : 'Erreur inconnue'}` });
    }
  });
}

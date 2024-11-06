import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const form = formidable({
    uploadDir: path.join(process.cwd(), 'public/uploads/users'),
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  // Créer le dossier d'upload s'il n'existe pas
  const uploadDir = path.join(process.cwd(), 'public/uploads/users');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    const [fields, files] = await form.parse(req);
    const imageFile = files.image?.[0] as formidable.File | undefined;

    if (!imageFile) {
      return res.status(400).json({ message: 'Aucune image n\'a été uploadée' });
    }

    // Générer l'URL de l'image
    const imageUrl = `/uploads/users/${path.basename(imageFile.filepath)}`;

    return res.status(200).json({
      url: imageUrl,
      message: 'Image uploadée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image' });
  }
}

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

  try {
    const [fields, files] = await form.parse(req);
    const imageFile = files.image?.[0] as formidable.File | undefined;

    if (!imageFile) {
      return res.status(400).json({ message: 'Aucune image n\'a été uploadée' });
    }

    // Utiliser Vercel Blob pour l'upload
    const blob = await fetch('https://api.vercel.com/v1/blobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      },
      body: fs.readFileSync(imageFile.filepath), // Lire le fichier
    });

    const blobData = await blob.json();
    const imageUrl = blobData.url; // URL de l'image uploadée

    return res.status(200).json({
      url: imageUrl,
      message: 'Image uploadée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image' });
  }
}

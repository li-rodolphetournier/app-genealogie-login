import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false, // Désactiver le bodyParser pour permettre l'upload de fichiers
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  try {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'public/uploads/objects'),
      keepExtensions: true,
      filename: (name, ext) => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`,
      multiples: true,
    });

    const [fields, files] = await form.parse(req);
    
    // Créer l'objet
    const objectData = {
      nom: fields.nom?.[0] || '',
      type: fields.type?.[0] || '',
      status: fields.status?.[0] || 'brouillon',
      utilisateur: fields.utilisateur?.[0] || '',
      id: Date.now().toString(),
      photos: [],
    };

    // Gérer les photos si présentes
    if (files.photos) {
      const photos = Array.isArray(files.photos) ? files.photos : [files.photos];
      objectData.photos = photos.map(file => ({
        url: `/uploads/objects/${path.basename(file.filepath)}`,
        description: ['']
      }));
    }

    // Lire et mettre à jour le fichier JSON
    const objectsPath = path.join(process.cwd(), 'src/data/objects.json');
    const jsonData = fs.readFileSync(objectsPath, 'utf8');
    const objects = JSON.parse(jsonData);
    objects.push(objectData);
    fs.writeFileSync(objectsPath, JSON.stringify(objects, null, 2));

    return res.status(200).json(objectData);
  } catch (error) {
    console.error('Error creating object:', error);
    return res.status(500).json({ message: 'Erreur lors de la création de l\'objet' });
  }
}

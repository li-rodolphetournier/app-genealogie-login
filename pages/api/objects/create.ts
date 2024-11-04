import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Définir l'interface pour les photos
interface Photo {
  url: string;
  description: string[];
}

// Définir l'interface pour l'objet
interface ObjectData {
  id: string;
  nom: string;
  type: string;
  status: 'brouillon' | 'publie';
  utilisateur: string;
  photos: Photo[];
}

// Interface pour le fichier uploadé
interface UploadedFile {
  filepath: string;
}

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
    
    const objectData: ObjectData = {
      id: Date.now().toString(),
      nom: fields.nom?.[0] || '',
      type: fields.type?.[0] || '',
      status: (fields.status?.[0] as 'brouillon' | 'publie') || 'brouillon',
      utilisateur: fields.utilisateur?.[0] || '',
      photos: [],
    };

    if (files.photos) {
      const photos = Array.isArray(files.photos) ? files.photos : [files.photos];
      objectData.photos = photos.map((file: UploadedFile) => ({
        url: `/uploads/objects/${path.basename(file.filepath)}`,
        description: ['']
      }));
    }

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

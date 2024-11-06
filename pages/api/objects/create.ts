import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ImageData {
  url: string;
  description: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const uploadDir = path.join(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    multiples: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Erreur lors du traitement du formulaire:', err);
      return res.status(500).json({ message: `Erreur lors du traitement du formulaire: ${err.message}` });
    }

    try {
      let images: ImageData[] = [];
      if (Array.isArray(files.image)) {
        images = files.image.map((file: formidable.File, index: number) => ({
          url: `/uploads/${file.newFilename}`,
          description: fields[`imageDescription${index}`]?.[0] || '' // Utilisation de l'opérateur optionnel et accès au premier élément
        }));
      } else if (files.image) {
        images = [{
          url: `/uploads/${(files.image as formidable.File).newFilename}`,
          description: Array.isArray(fields.imageDescription0) ? fields.imageDescription0[0] : (fields.imageDescription0 || '') // Gestion des deux cas possibles
        }];
      }

      const newObject = {
        id: Date.now().toString(),
        nom: Array.isArray(fields.nom) ? fields.nom[0] : fields.nom || '',
        type: Array.isArray(fields.type) ? fields.type[0] : fields.type || '',
        utilisateur: Array.isArray(fields.utilisateur) ? fields.utilisateur[0] : fields.utilisateur || '',
        description: Array.isArray(fields.description) ? fields.description[0] : fields.description || '',
        status: Array.isArray(fields.status) ? fields.status[0] : fields.status || 'brouillon',
        images: images,
      };

      const objectsPath = path.join(process.cwd(), 'src/data/objects.json');
      const jsonData = fs.readFileSync(objectsPath, 'utf8');
      const objects = JSON.parse(jsonData);
      objects.push(newObject);
      fs.writeFileSync(objectsPath, JSON.stringify(objects, null, 2));

      return res.status(200).json({ message: 'Objet ajouté avec succès', object: newObject });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'objet:', error);
      res.status(500).json({ message: `Erreur lors de l'ajout de l'objet: ${error instanceof Error ? error.message : 'Erreur inconnue'}` });
    }
  });
}

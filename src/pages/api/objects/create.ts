import formidable from 'formidable';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

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
          description: (fields[`imageDescription${index}`] as string[] | string)?.[0] || ''
        }));
      } else if (files.image) {
        images = [{
          url: `/uploads/${(files.image as formidable.File).newFilename}`,
          description: Array.isArray(fields.imageDescription0) 
          ? fields.imageDescription0[0] 
          : fields.imageDescription0 || ''
        }];
      }

      const newObject = {
        id: Date.now().toString(),
        nom: Array.isArray(fields.nom) 
        ? fields.nom[0] 
        : fields.nom || '',
        type: Array.isArray(fields.type) 
        ? fields.type[0] 
        : fields.type || '',
        utilisateur: Array.isArray(fields.utilisateur) 
        ? fields.utilisateur[0] 
        : fields.utilisateur || '',
        description: Array.isArray(fields.description) 
        ? fields.description[0] 
        : fields.description || '',
        status: Array.isArray(fields.status) 
        ? fields.status[0] 
        : fields.status || '',
        images: images,
      };

      const dataFilePath = path.join(process.cwd(), 'src/data/objects.json');
      let objects = [];
      try {
        const jsonData = fs.readFileSync(dataFilePath, 'utf8');
        objects = JSON.parse(jsonData);
      } catch (error) {
        console.warn('Le fichier JSON était vide ou invalide. Création d\'un nouveau tableau.');
      }

      if (!Array.isArray(objects)) {
        objects = [];
      }

      if (newObject.status !== 'brouillon' && newObject.status !== 'publie') {
        return res.status(400).json({ error: 'Le status doit être "brouillon" ou "publie"' });
      }

      objects.push(newObject);
      fs.writeFileSync(dataFilePath, JSON.stringify(objects, null, 2));

      res.status(200).json({ message: 'Objet ajouté avec succès', object: newObject });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'objet:', error);
      res.status(500).json({ message: `Erreur lors de l'ajout de l'objet: ${error instanceof Error ? error.message : 'Erreur inconnue'}` });
    }
  });
}

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
          description: fields[`imageDescription${index}`] as string || ''
        }));
      } else if (files.image) {
        images = [{
          url: `/uploads/${(files.image as formidable.File).newFilename}`,
          description: fields.imageDescription0 as string || ''
        }];
      }

      const newObject = {
        id: Date.now().toString(),
        nom: fields.nom as string,
        type: fields.type as string,
        utilisateur: fields.utilisateur as string,
        description: fields.description as string,
        status: fields.status as string,
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

      objects.push(newObject);
      fs.writeFileSync(dataFilePath, JSON.stringify(objects, null, 2));

      res.status(200).json({ message: 'Objet ajouté avec succès', object: newObject });
    } catch (err) {
      console.error('Erreur:', err);
      res.status(500).json({ message: `Erreur lors de l'ajout de l'objet: ${err instanceof Error ? err.message : 'Erreur inconnue'}` });
    }
  });
}

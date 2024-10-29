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
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Créer le dossier d'upload s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public/uploads/objects');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // Augmenté à 10MB
      maxTotalFileSize: 50 * 1024 * 1024, // Augmenté à 50MB pour les uploads multiples
    });

    form.parse(req, (err, fields, files: any) => {
      if (err) {
        console.error('Erreur lors du parsing du formulaire:', err);
        return res.status(500).json({ 
          error: 'Erreur lors de l\'upload du fichier',
          details: err.message,
          hint: err.code === 1009 ? 'La taille du fichier dépasse la limite autorisée (10MB par fichier, 50MB au total)' : undefined
        });
      }

      try {
        const file = files.file;
        if (!file) {
          return res.status(400).json({ error: 'Aucun fichier n\'a été uploadé' });
        }

        // Gérer le cas où file est un tableau
        const fileToProcess = Array.isArray(file) ? file[0] : file;

        // Générer un nom de fichier unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(fileToProcess.originalFilename || '');
        const newFileName = `${uniqueSuffix}${extension}`;
        const newPath = path.join(uploadDir, newFileName);

        // Renommer le fichier
        fs.renameSync(fileToProcess.filepath, newPath);

        const relativeFilePath = `/uploads/objects/${newFileName}`;
        console.log('Fichier uploadé avec succès:', relativeFilePath);

        return res.status(200).json({ url: relativeFilePath });
      } catch (error) {
        console.error('Erreur lors du traitement du fichier:', error);
        return res.status(500).json({ error: 'Erreur lors du traitement du fichier' });
      }
    });
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return res.status(500).json({ error: 'Une erreur inattendue s\'est produite' });
  }
}

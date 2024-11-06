import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    maxDuration: 60,
  },
};

interface Photo {
  url: string;
  description: string[];
}

interface ObjectData {
  id: string;
  nom: string;
  type: string;
  status: 'brouillon' | 'publie';
  utilisateur: string;
  photos: Photo[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Créer un dossier temporaire pour Vercel
  const tmpDir = '/tmp';
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  try {
    const form = formidable({
      uploadDir: tmpDir,
      keepExtensions: true,
      maxFiles: 5,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filename: (name, ext) => `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`
    });

    // Parser le formulaire de manière asynchrone
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const objectData: ObjectData = {
      id: Date.now().toString(),
      nom: Array.isArray(fields.nom) ? fields.nom[0] : fields.nom || '',
      type: Array.isArray(fields.type) ? fields.type[0] : fields.type || '',
      status: (Array.isArray(fields.status) ? fields.status[0] : fields.status || 'brouillon') as 'brouillon' | 'publie',
      utilisateur: Array.isArray(fields.utilisateur) ? fields.utilisateur[0] : fields.utilisateur || '',
      photos: []
    };

    // Gérer les photos
    if (files.photos) {
      const photoFiles = Array.isArray(files.photos) ? files.photos : [files.photos];
      
      // Créer le dossier de destination s'il n'existe pas
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'objects');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Traiter chaque photo
      objectData.photos = await Promise.all(photoFiles.map(async (file) => {
        const fileName = path.basename(file.filepath);
        const newPath = path.join(uploadDir, fileName);

        try {
          // Copier le fichier au lieu de le déplacer
          await fs.promises.copyFile(file.filepath, newPath);
          // Nettoyer le fichier temporaire
          await fs.promises.unlink(file.filepath);

          return {
            url: `/uploads/objects/${fileName}`,
            description: ['']
          };
        } catch (error) {
          console.error('Erreur lors du traitement du fichier:', error);
          throw error;
        }
      }));
    }

    // Sauvegarder dans le fichier JSON
    const dataPath = path.join(process.cwd(), 'src/data/objects.json');
    let objects = [];
    
    try {
      if (fs.existsSync(dataPath)) {
        const data = await fs.promises.readFile(dataPath, 'utf8');
        objects = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Création d\'un nouveau fichier objects.json');
    }

    objects.push(objectData);
    await fs.promises.writeFile(dataPath, JSON.stringify(objects, null, 2));

    return res.status(200).json(objectData);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      message: 'Erreur lors de la création de l\'objet',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
}

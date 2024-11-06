import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { getTempDir } from '@/utils/tempPath';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    maxDuration: 30,
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

  try {
    const uploadDir = getTempDir();
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFiles: 5,
      maxFileSize: 5 * 1024 * 1024,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

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
      
      const publicUploadDir = path.join(process.cwd(), 'public/uploads/objects');
      if (!fs.existsSync(publicUploadDir)) {
        fs.mkdirSync(publicUploadDir, { recursive: true });
      }

      objectData.photos = await Promise.all(photos.map(async (file: formidable.File) => {
        const newPath = path.join(publicUploadDir, file.newFilename);
        await fs.promises.copyFile(file.filepath, newPath);
        await fs.promises.unlink(file.filepath);

        return {
          url: `/uploads/objects/${file.newFilename}`,
          description: ['']
        };
      }));
    }

    const dataPath = path.join(process.cwd(), 'src/data/objects.json');
    let objects = [];
    try {
      const data = await fs.promises.readFile(dataPath, 'utf8');
      objects = JSON.parse(data);
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
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

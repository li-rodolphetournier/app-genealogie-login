import formidable from 'formidable';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
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

interface FormFields {
  [key: string]: string[] | undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
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

    if (files.image) {
      const images = Array.isArray(files.image) ? files.image : [files.image];
      objectData.photos = images.map((file: formidable.File, index: number) => ({
        url: `/uploads/${file.newFilename}`,
        description: [(fields[`imageDescription${index}`]?.[0] || '').toString()]
      }));
    }

    const objectsPath = path.join(process.cwd(), 'src/data/objects.json');
    const jsonData = fs.readFileSync(objectsPath, 'utf8');
    const objects = JSON.parse(jsonData);
    objects.push(objectData);
    fs.writeFileSync(objectsPath, JSON.stringify(objects, null, 2));

    return res.status(200).json(objectData);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

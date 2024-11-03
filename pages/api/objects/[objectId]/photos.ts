import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { objectId, photoIndex } = req.query;
  const objectsPath = path.join(process.cwd(), 'src/data/objects.json');

  if (req.method === 'DELETE') {
    try {
      const jsonData = fs.readFileSync(objectsPath, 'utf8');
      const objects = JSON.parse(jsonData);

      const objectIndex = objects.findIndex((obj: any) => obj.id === objectId);
      if (objectIndex === -1) {
        return res.status(404).json({ message: 'Objet non trouvé' });
      }

      const photoIdx = parseInt(photoIndex as string);
      if (isNaN(photoIdx) || photoIdx < 0 || !objects[objectIndex].photos || photoIdx >= objects[objectIndex].photos.length) {
        return res.status(400).json({ message: 'Index de photo invalide' });
      }

      // Supprimer le fichier physique
      const photoUrl = objects[objectIndex].photos[photoIdx].url;
      const filePath = path.join(process.cwd(), 'public', photoUrl);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error('Erreur lors de la suppression du fichier:', error);
        }
      }

      // Supprimer la photo du tableau
      objects[objectIndex].photos.splice(photoIdx, 1);
      fs.writeFileSync(objectsPath, JSON.stringify(objects, null, 2));

      return res.status(200).json({ message: 'Photo supprimée avec succès' });
    } catch (error) {
      console.error('Error deleting photo:', error);
      return res.status(500).json({ message: 'Erreur lors de la suppression de la photo' });
    }
  }

  if (req.method === 'POST') {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'public/uploads/objects'),
      keepExtensions: true,
      filename: (name, ext) => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`,
    });

    try {
      const [fields, files] = await form.parse(req);
      const uploadedFiles = Array.isArray(files.photos) ? files.photos : [files.photos];

      const jsonData = fs.readFileSync(objectsPath, 'utf8');
      const objects = JSON.parse(jsonData);

      const objectIndex = objects.findIndex((obj: any) => obj.id === objectId);
      if (objectIndex === -1) {
        return res.status(404).json({ message: 'Objet non trouvé' });
      }

      const newPhotos = uploadedFiles.map((file: any) => ({
        url: `/uploads/objects/${path.basename(file.filepath)}`,
        description: ['']
      }));

      objects[objectIndex].photos = [
        ...(objects[objectIndex].photos || []),
        ...newPhotos
      ];

      fs.writeFileSync(objectsPath, JSON.stringify(objects, null, 2));

      return res.status(200).json({ photos: newPhotos });
    } catch (error) {
      console.error('Error uploading files:', error);
      return res.status(500).json({ message: 'Erreur lors du téléchargement des fichiers' });
    }
  }

  return res.status(405).json({ message: 'Méthode non autorisée' });
} 
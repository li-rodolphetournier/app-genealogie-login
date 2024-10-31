import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface FormFields {
  // ... définir les types des champs
}

interface FormFiles {
  // ... définir les types des fichiers
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors du traitement du formulaire' });
      }

      // Ici, vous devriez implémenter la logique pour mettre à jour l'utilisateur
      // Par exemple, mettre à jour le fichier users.json

      res.status(200).json({ message: 'Profil mis à jour avec succès' });
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';

interface UpdateUserFields {
  userId: string;
  login: string;
  password?: string;
}

interface UpdateUserFiles {
  avatar?: formidable.File;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req) as [UpdateUserFields, UpdateUserFiles];

    // Utiliser fields et files ici
    const { userId, login, password } = fields;
    const avatar = files.avatar;

    // ... reste du code ...

  } catch (err) {
    console.error('Erreur:', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
}

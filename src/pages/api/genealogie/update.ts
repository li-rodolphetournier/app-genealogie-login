interface GenealogyData {
  id: string;
  name: string;
  children?: GenealogyData[];
  // Ajoutez d'autres propriétés selon votre structure
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const genealogyData = req.body as GenealogyData;
    // ... reste du code avec le type approprié
  } catch (err) {
    console.error('Erreur:', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
} 
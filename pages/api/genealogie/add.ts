import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Person } from '@/types/genealogy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), 'src/data/genealogie.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const currentData = JSON.parse(fileData);
    
    const newPerson = req.body;
    
    // Réorganiser les champs dans le bon ordre
    const formattedPerson: Person = {
      id: newPerson.id,
      nom: newPerson.nom,
      prenom: newPerson.prenom,
      genre: newPerson.genre,
      description: newPerson.description,
      mere: newPerson.mere,
      pere: newPerson.pere,
      ordreNaissance: newPerson.ordreNaissance,
      dateNaissance: newPerson.dateNaissance,
      dateDeces: newPerson.dateDeces,
      image: newPerson.image
    };

    currentData.push(formattedPerson);

    // Écrire dans le fichier avec une indentation de 2 espaces
    fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
    
    res.status(200).json({ message: 'Person added successfully', person: formattedPerson });
  } catch (error) {
    console.error('Error adding person:', error);
    res.status(500).json({ message: 'Error adding person to genealogy' });
  }
} 
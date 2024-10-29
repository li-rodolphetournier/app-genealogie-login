import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), 'src/data/genealogie.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    let persons = JSON.parse(fileData);
    
    const updatedPerson = req.body;
    
    // Mettre à jour la personne
    persons = persons.map((person: any) => 
      person.id === updatedPerson.id ? updatedPerson : person
    );

    // Écrire les modifications dans le fichier
    fs.writeFileSync(filePath, JSON.stringify(persons, null, 2));
    
    res.status(200).json({ message: 'Person updated successfully' });
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ message: 'Error updating person' });
  }
} 
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ObjectData {
  id: string;
  nom: string;
  type: string;
  description: string;
  status: 'publie' | 'brouillon';
  utilisateur: string;
  images: string[];
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Créer le nouvel objet
    const newObject: ObjectData = {
      id: Date.now().toString(),
      nom: body.nom,
      type: body.type,
      description: body.description,
      status: body.status,
      utilisateur: body.utilisateur,
      images: body.images || []
    };

    // Lire le fichier existant
    const dataFilePath = path.join(process.cwd(), 'src/data/objects.json');
    let objects = [];
    
    try {
      if (fs.existsSync(dataFilePath)) {
        const jsonData = fs.readFileSync(dataFilePath, 'utf8');
        objects = JSON.parse(jsonData);
      }
    } catch (err) {
      console.warn('Le fichier JSON était vide ou invalide. Création d\'un nouveau tableau.');
    }

    if (!Array.isArray(objects)) {
      objects = [];
    }

    // Ajouter le nouvel objet
    objects.push(newObject);

    // Écrire dans le fichier
    fs.writeFileSync(dataFilePath, JSON.stringify(objects, null, 2));

    return NextResponse.json({ 
      message: 'Objet ajouté avec succès', 
      object: newObject 
    }, { status: 201 });
  } catch (err) {
    console.error('Erreur lors de la création:', err);
    return NextResponse.json({ 
      error: 'Erreur lors de la création de l\'objet' 
    }, { status: 500 });
  }
} 
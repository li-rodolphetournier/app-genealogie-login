import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ObjectData {
  id: string;
  nom: string;
  type: string;
  description?: string;
  status: 'publie' | 'brouillon';
  utilisateur: string;
  images?: string[];
  photos?: Array<{ url: string; description: string[] }>;
}

export async function GET(
  request: Request,
  { params }: { params: { objectId: string } }
): Promise<NextResponse> {
  try {
    const dataFilePath = path.join(process.cwd(), 'src/data/objects.json');
    const jsonData = fs.readFileSync(dataFilePath, 'utf8');
    const objects: ObjectData[] = JSON.parse(jsonData);

    const object = objects.find(obj => obj.id === params.objectId);

    if (!object) {
      return NextResponse.json(
        { error: 'Objet non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(object);
  } catch (err) {
    console.error('Erreur lors de la lecture de l\'objet:', err);
    return NextResponse.json(
      { error: 'Erreur lors de la lecture de l\'objet' },
      { status: 500 }
    );
  }
} 
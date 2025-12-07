import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Person } from '@/types/genealogy';
import type { ErrorResponse } from '@/types/api/responses';

const genealogiePath = path.join(process.cwd(), 'src/data/genealogie.json');

// GET - Récupérer toutes les personnes de la généalogie
export async function GET() {
  try {
    const data = await fs.readFile(genealogiePath, 'utf-8');
    const genealogyData = JSON.parse(data) as Person[];
    
    return NextResponse.json<Person[]>(genealogyData, { status: 200 });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json<Person[]>([], { status: 200 });
    }
    console.error('Erreur lors de la lecture des données généalogiques:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la lecture des données généalogiques' },
      { status: 500 }
    );
  }
}


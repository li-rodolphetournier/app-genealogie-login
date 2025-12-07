/**
 * Route API pour obtenir un token CSRF
 */

import { NextResponse } from 'next/server';
import { getCsrfToken, setCsrfToken } from '@/lib/security/csrf';
import { getErrorMessage } from '@/lib/errors/messages';

export async function GET() {
  try {
    // Récupérer le token existant ou en créer un nouveau
    let token = await getCsrfToken();

    if (!token) {
      token = await setCsrfToken();
    }

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la génération du token CSRF:', error);
    return NextResponse.json(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}


/**
 * Route API pour récupérer l'email d'un utilisateur par son login
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/errors/messages';
import type { ErrorResponse } from '@/types/api/responses';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login } = body;

    if (!login) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Login requis' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('login', login)
      .single();

    if (error || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('USER_NOT_FOUND') },
        { status: 404 }
      );
    }

    return NextResponse.json({ email: user.email }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'email:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}


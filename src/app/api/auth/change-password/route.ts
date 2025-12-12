/**
 * Route API pour changer le mot de passe (utilisateur connecté)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { logPasswordResetAction, getIpAddress, getUserAgent } from '@/lib/audit/password-reset-logger';
import { z } from 'zod';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Mot de passe actuel requis' }).min(1, 'Mot de passe actuel requis'),
  newPassword: z.string({ required_error: 'Nouveau mot de passe requis' }).min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
});

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const auth = await getAuthenticatedUser();
    if (!auth.user) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      const errorMessage = firstError?.message || 'Données invalides';
      return NextResponse.json<ErrorResponse>(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;
    const supabase = await createClient();

    // Vérifier le mot de passe actuel en se reconnectant
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Mot de passe actuel incorrect' },
        { status: 401 }
      );
    }

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la mise à jour du mot de passe' },
        { status: 500 }
      );
    }

    // Journaliser l'action
    await logPasswordResetAction({
      userId: auth.user.id,
      userEmail: user.email,
      actionType: 'change_password',
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
      success: true,
    });

    return NextResponse.json<SuccessResponse>(
      { message: 'Mot de passe modifié avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur change password:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


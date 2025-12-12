/**
 * Route API pour réinitialiser le mot de passe avec un token
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logPasswordResetAction, getIpAddress, getUserAgent } from '@/lib/audit/password-reset-logger';
import { z } from 'zod';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

const resetPasswordSchema = z.object({
  token: z.string().optional(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  useSession: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      const errorMessage = firstError?.message || 'Données invalides';
      return NextResponse.json<ErrorResponse>(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { token, password, useSession } = validation.data;
    const supabase = await createClient();

    let user = null;
    let verifyError = null;

    // Si useSession est true, utiliser la session automatiquement créée par Supabase
    if (useSession) {
      const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
      if (sessionUser) {
        user = sessionUser;
      } else {
        verifyError = sessionError;
      }
    } else if (token) {
      // Le token peut être un code ou un token_hash
      // Essayer d'abord avec exchangeCodeForSession (pour les codes)
      // C'est la méthode recommandée pour les liens de réinitialisation
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(token);
        if (sessionData?.user) {
          user = sessionData.user;
        } else if (sessionError) {
          verifyError = sessionError;
          console.log('[reset-password] exchangeCodeForSession error:', sessionError);
        }
      } catch (err) {
        console.log('[reset-password] exchangeCodeForSession exception:', err);
        verifyError = err instanceof Error ? err : new Error('Erreur lors de l\'échange du code');
      }

      // Si exchangeCodeForSession échoue, essayer avec verifyOtp (pour token_hash)
      if (!user) {
        try {
          const otpResult = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          });

          if (otpResult.data?.user) {
            user = otpResult.data.user;
          } else if (otpResult.error && !verifyError) {
            verifyError = otpResult.error;
            console.log('[reset-password] verifyOtp error:', otpResult.error);
          }
        } catch (err) {
          console.log('[reset-password] verifyOtp exception:', err);
        }
      }
    }

    // Si aucune méthode n'a fonctionné, essayer de récupérer l'utilisateur depuis la session
    // Parfois Supabase crée une session temporaire lors du clic sur le lien
    if (!user) {
      try {
        const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();
        if (sessionUser) {
          user = sessionUser;
        } else if (sessionError && !verifyError) {
          verifyError = sessionError;
          console.log('[reset-password] getUser error:', sessionError);
        }
      } catch (err) {
        console.log('[reset-password] getUser exception:', err);
      }
    }

    if (!user) {
      console.error('Erreur vérification token:', verifyError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Token invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.' },
        { status: 400 }
      );
    }

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la réinitialisation du mot de passe' },
        { status: 500 }
      );
    }

    // Journaliser l'action
    await logPasswordResetAction({
      userId: user.id,
      userEmail: user.email || '',
      actionType: 'reset_password',
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
      success: true,
    });

    return NextResponse.json<SuccessResponse>(
      { message: 'Mot de passe réinitialisé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur reset password:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


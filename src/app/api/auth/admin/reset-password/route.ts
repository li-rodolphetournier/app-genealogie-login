/**
 * Route API pour réinitialiser le mot de passe par un administrateur
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { logPasswordResetAction, getIpAddress, getUserAgent } from '@/lib/audit/password-reset-logger';
import { z } from 'zod';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

const adminResetPasswordSchema = z.object({
  userLogin: z.string().min(1, 'Login utilisateur requis'),
  reason: z.string().optional(), // Raison de la réinitialisation
});

export async function POST(request: Request) {
  try {
    // Vérifier que l'utilisateur est admin
    const auth = await getAuthenticatedUser();
    if (!auth.user || auth.user.status !== 'administrateur') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Accès non autorisé. Administrateur requis.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = adminResetPasswordSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      const errorMessage = firstError?.message || 'Données invalides';
      return NextResponse.json<ErrorResponse>(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { userLogin, reason } = validation.data;
    const supabase = await createServiceRoleClient();

    // Récupérer l'utilisateur cible
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email, login')
      .eq('login', userLogin)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Générer le lien de réinitialisation
    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: targetUser.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://genealogie-famille.vercel.app'}/reset-password`,
      },
    });

    // Stocker le message d'erreur avant la vérification pour le logging
    const linkErrorMessage = linkError?.message;

    if (linkError) {
      console.error('Erreur génération lien:', linkError);
      
      // Journaliser l'action (échec)
      await logPasswordResetAction({
        userId: targetUser.id,
        userEmail: targetUser.email,
        actionType: 'admin_reset',
        adminId: auth.user.id,
        adminLogin: auth.user.login,
        reason: reason || 'Réinitialisation par administrateur',
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
        success: false,
        errorMessage: linkErrorMessage,
      });

      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la génération du lien de réinitialisation' },
        { status: 500 }
      );
    }

    // Journaliser l'action (succès)
    await logPasswordResetAction({
      userId: targetUser.id,
      userEmail: targetUser.email,
      actionType: 'admin_reset',
      adminId: auth.user.id,
      adminLogin: auth.user.login,
      reason: reason || 'Réinitialisation par administrateur',
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
      success: true,
      errorMessage: undefined,
    });

    return NextResponse.json<SuccessResponse>(
      { 
        message: `Un lien de réinitialisation a été envoyé à ${targetUser.email}`,
        data: { email: targetUser.email }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur admin reset password:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


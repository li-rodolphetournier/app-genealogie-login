/**
 * Route API pour demander une réinitialisation de mot de passe
 * Utilise Supabase Auth pour générer un lien sécurisé
 */

import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { logPasswordResetAction, getIpAddress, getUserAgent } from '@/lib/audit/password-reset-logger';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  login: z.string().min(3, 'Login invalide').optional(),
}).refine(data => data.email || data.login, {
  message: 'Email ou login requis',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues?.[0];
      const errorMessage = firstError?.message || 'Données invalides';
      return NextResponse.json<ErrorResponse>(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { email, login } = validation.data;
    const supabase = await createServiceRoleClient();

    // Si login fourni, récupérer l'email
    let userEmail = email;
    if (!userEmail && login) {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('login', login)
        .single();

      if (!user) {
        // Ne pas révéler si l'utilisateur existe ou non (sécurité)
        return NextResponse.json<SuccessResponse>(
          { message: 'Si cet email/login existe, un lien de réinitialisation a été envoyé.' },
          { status: 200 }
        );
      }

      userEmail = user.email;
    }

    if (!userEmail) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Email ou login requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe dans auth.users
    // Si l'utilisateur existe dans public.users mais pas dans auth.users,
    // créer un compte dans auth.users avec un mot de passe temporaire
    try {
      // Vérifier que l'utilisateur existe dans public.users
      const { data: publicUser } = await supabase
        .from('users')
        .select('id, email, login, status')
        .eq('email', userEmail)
        .single();

      if (publicUser) {
        // Vérifier si l'utilisateur existe dans auth.users en listant les utilisateurs
        const { data: authUsersData } = await supabase.auth.admin.listUsers();
        const authUser = authUsersData?.users?.find(u => u.email === userEmail);

        // Si l'utilisateur n'existe pas dans auth.users, le créer
        if (!authUser) {
          // Créer l'utilisateur dans auth.users avec un mot de passe temporaire aléatoire
          // L'utilisateur devra le réinitialiser via le lien envoyé
          const tempPassword = `temp_${Math.random().toString(36).slice(-12)}_${Date.now()}`;
          
          const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
            email: userEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              login: publicUser.login,
              status: publicUser.status || 'utilisateur',
            },
          });

          if (createError) {
            // Si l'erreur est "already exists", c'est OK, l'utilisateur existe déjà
            if (!createError.message?.includes('already') && !createError.message?.includes('exists')) {
              logger.error('[API /auth/forgot-password] Erreur création auth.users:', createError);
            }
          } else if (newAuthUser?.user) {
            // S'assurer que l'ID correspond entre auth.users et public.users
            if (newAuthUser.user.id !== publicUser.id) {
              // Mettre à jour l'ID dans public.users pour correspondre à auth.users
              await supabase
                .from('users')
                .update({ id: newAuthUser.user.id })
                .eq('email', userEmail);
            }
          }
        }
      }
    } catch (error) {
      // En cas d'erreur, continuer quand même pour ne pas révéler si l'utilisateur existe
      logger.error('[API /auth/forgot-password] Erreur vérification utilisateur:', error);
    }

    // Utiliser resetPasswordForEmail qui envoie automatiquement l'email
    // Note: resetPasswordForEmail ne révèle pas si l'utilisateur existe ou non (sécurité)
    // On utilise un client normal car resetPasswordForEmail nécessite un client public
    const publicSupabase = await createClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://genealogie-famille.vercel.app'}/reset-password`;
    logger.debug(`[API /auth/forgot-password] URL de redirection utilisée: ${redirectUrl}`);
    const { error } = await publicSupabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: redirectUrl,
    });

    // Stocker le message d'erreur avant la vérification pour le logging
    const errorMessage = error?.message;

    if (error) {
      logger.error('[API /auth/forgot-password] Erreur envoi email:', error);
      
      // Journaliser l'action (échec)
      await logPasswordResetAction({
        userEmail: userEmail,
        actionType: 'forgot_password',
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
        success: false,
        errorMessage: errorMessage,
      });

      // Ne pas révéler l'erreur à l'utilisateur (sécurité)
      return NextResponse.json<SuccessResponse>(
        { message: 'Si cet email/login existe, un lien de réinitialisation a été envoyé.' },
        { status: 200 }
      );
    }

    // Journaliser l'action (succès)
    await logPasswordResetAction({
      userEmail: userEmail,
      actionType: 'forgot_password',
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
      success: true,
      errorMessage: undefined,
    });

    return NextResponse.json<SuccessResponse>(
      { message: 'Si cet email/login existe, un lien de réinitialisation a été envoyé.' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[API /auth/forgot-password] Erreur:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}


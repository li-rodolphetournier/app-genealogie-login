/**
 * Service de journalisation pour les réinitialisations de mot de passe
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

export type PasswordResetActionType = 
  | 'forgot_password' 
  | 'reset_password' 
  | 'change_password' 
  | 'admin_reset';

export interface PasswordResetLogData {
  userId?: string;
  userEmail: string;
  actionType: PasswordResetActionType;
  adminId?: string;
  adminLogin?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Journalise une action de réinitialisation de mot de passe
 */
export async function logPasswordResetAction(data: PasswordResetLogData): Promise<void> {
  try {
    const supabase = await createServiceRoleClient();

    const logEntry: any = {
      user_id: data.userId || null,
      user_email: data.userEmail,
      action_type: data.actionType,
      admin_id: data.adminId || null,
      admin_login: data.adminLogin || null,
      reason: data.reason || null,
      ip_address: data.ipAddress || null,
      user_agent: data.userAgent || null,
      success: data.success !== false,
      error_message: data.errorMessage || null,
    };

    const { error } = await supabase
      .from('password_reset_logs')
      .insert(logEntry);

    if (error) {
      console.error('Erreur lors de la journalisation de la réinitialisation de mot de passe:', error);
      // Ne pas faire échouer l'opération principale si la journalisation échoue
    }
  } catch (error) {
    console.error('Erreur lors de la journalisation:', error);
    // Ne pas faire échouer l'opération principale si la journalisation échoue
  }
}

/**
 * Récupère les logs de réinitialisation pour un utilisateur
 */
export async function getPasswordResetLogs(
  userId?: string,
  userEmail?: string,
  limit: number = 50
): Promise<PasswordResetLogData[]> {
  try {
    const supabase = await createServiceRoleClient();
    let query = supabase
      .from('password_reset_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.eq('user_email', userEmail);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      return [];
    }

    return (data || []).map((log: any) => ({
      userId: log.user_id,
      userEmail: log.user_email,
      actionType: log.action_type as PasswordResetActionType,
      adminId: log.admin_id,
      adminLogin: log.admin_login,
      reason: log.reason,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      success: log.success,
      errorMessage: log.error_message,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    return [];
  }
}

/**
 * Récupère l'adresse IP depuis une requête
 */
export function getIpAddress(request: Request): string | undefined {
  // Essayer plusieurs headers pour obtenir l'IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return undefined;
}

/**
 * Récupère le User-Agent depuis une requête
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}


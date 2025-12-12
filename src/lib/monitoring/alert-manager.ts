/**
 * Gestionnaire d'alertes de sécurité
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { SecurityAlert, SecurityAlertType, SecurityAlertLevel } from './types';
import { randomBytes } from 'crypto';

/**
 * Crée une alerte de sécurité
 */
export async function createSecurityAlert(
  type: SecurityAlertType,
  level: SecurityAlertLevel,
  message: string,
  metadata?: {
    ip?: string;
    userId?: string;
    userEmail?: string;
    [key: string]: any;
  }
): Promise<void> {
  try {
    const supabase = await createServiceRoleClient();
    
    const alert: Omit<SecurityAlert, 'id' | 'resolved' | 'resolvedAt'> = {
      type,
      level,
      message,
      timestamp: new Date().toISOString(),
      ip: metadata?.ip,
      userId: metadata?.userId,
      userEmail: metadata?.userEmail,
      metadata: metadata ? { ...metadata, ip: undefined, userId: undefined, userEmail: undefined } : undefined,
    };

    await supabase.from('security_alerts').insert({
      ...alert,
      id: randomBytes(16).toString('hex'),
      resolved: false,
    });
  } catch (error) {
    console.error('[Security Alert] Erreur lors de la création de l\'alerte:', error);
  }
}

/**
 * Récupère les alertes de sécurité
 */
export async function getSecurityAlerts(
  filters?: {
    level?: SecurityAlertLevel;
    type?: SecurityAlertType;
    resolved?: boolean;
    limit?: number;
  }
): Promise<SecurityAlert[]> {
  try {
    const supabase = await createServiceRoleClient();
    let query = supabase.from('security_alerts').select('*').order('timestamp', { ascending: false });

    if (filters?.level) {
      query = query.eq('level', filters.level);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.resolved !== undefined) {
      query = query.eq('resolved', filters.resolved);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as SecurityAlert[];
  } catch (error) {
    console.error('[Security Alert] Erreur lors de la récupération des alertes:', error);
    return [];
  }
}

/**
 * Marque une alerte comme résolue
 */
export async function resolveSecurityAlert(alertId: string): Promise<void> {
  try {
    const supabase = await createServiceRoleClient();
    await supabase
      .from('security_alerts')
      .update({ resolved: true, resolvedAt: new Date().toISOString() })
      .eq('id', alertId);
  } catch (error) {
    console.error('[Security Alert] Erreur lors de la résolution de l\'alerte:', error);
  }
}


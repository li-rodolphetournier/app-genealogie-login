/**
 * Calcul des métriques de sécurité
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { SecurityMetrics, SecurityAlertType } from './types';

export async function getSecurityMetrics(): Promise<SecurityMetrics> {
  try {
    const supabase = await createServiceRoleClient();
    
    const { data: alerts } = await supabase
      .from('security_alerts')
      .select('*');

    if (!alerts || alerts.length === 0) {
      return {
        totalAlerts: 0,
        criticalAlerts: 0,
        highAlerts: 0,
        mediumAlerts: 0,
        lowAlerts: 0,
        alertsLast24h: 0,
        alertsLast7d: 0,
        topAlertTypes: [],
      };
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const alertsLast24h = alerts.filter(a => new Date(a.timestamp) >= last24h).length;
    const alertsLast7d = alerts.filter(a => new Date(a.timestamp) >= last7d).length;

    const criticalAlerts = alerts.filter(a => a.level === 'critical' && !a.resolved).length;
    const highAlerts = alerts.filter(a => a.level === 'high' && !a.resolved).length;
    const mediumAlerts = alerts.filter(a => a.level === 'medium' && !a.resolved).length;
    const lowAlerts = alerts.filter(a => a.level === 'low' && !a.resolved).length;

    const typeCounts = new Map<SecurityAlertType, number>();
    alerts.forEach(alert => {
      const count = typeCounts.get(alert.type) || 0;
      typeCounts.set(alert.type, count + 1);
    });

    const topAlertTypes = Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAlerts: alerts.length,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      alertsLast24h,
      alertsLast7d,
      topAlertTypes,
    };
  } catch (error) {
    console.error('[Security Metrics] Erreur:', error);
    return {
      totalAlerts: 0,
      criticalAlerts: 0,
      highAlerts: 0,
      mediumAlerts: 0,
      lowAlerts: 0,
      alertsLast24h: 0,
      alertsLast7d: 0,
      topAlertTypes: [],
    };
  }
}


import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSecurityMetrics } from '../metrics';
import { createServiceRoleClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

describe('getSecurityMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne des métriques vides quand aucune alerte', async () => {
    vi.mocked(createServiceRoleClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    } as any);

    const metrics = await getSecurityMetrics();
    expect(metrics.totalAlerts).toBe(0);
    expect(metrics.topAlertTypes).toEqual([]);
  });

  it('calcule correctement les compteurs et topAlertTypes', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
    const lastWeek = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const alerts = [
      { level: 'high', resolved: false, timestamp: yesterday, type: 'rate_limit' },
      { level: 'low', resolved: false, timestamp: lastWeek, type: 'headers' },
    ];

    vi.mocked(createServiceRoleClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: alerts, error: null }),
      }),
    } as any);

    const metrics = await getSecurityMetrics();
    expect(metrics.totalAlerts).toBe(2);
    expect(metrics.highAlerts).toBe(1);
    expect(metrics.lowAlerts).toBe(1);
    expect(metrics.alertsLast24h).toBe(1);
    expect(metrics.alertsLast7d).toBe(2);
    expect(metrics.topAlertTypes[0].type).toBe('rate_limit');
  });
});



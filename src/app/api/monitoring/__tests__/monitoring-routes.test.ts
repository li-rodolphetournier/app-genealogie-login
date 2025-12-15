/**
 * Tests pour les routes de monitoring sécurité et Lighthouse
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as lighthouseRoute from '../lighthouse/route';
import * as testsRoute from '../tests/route';
import * as metricsRoute from '../metrics/route';
import * as alertsRoute from '../alerts/route';
import { requireAdmin } from '@/lib/auth/middleware';
import { isProduction } from '@/lib/utils/env';
import { getLatestLighthouseReport } from '@/lib/lighthouse/redis';
import { runSecurityTests } from '@/lib/security/tests/security-tests';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getSecurityMetrics } from '@/lib/monitoring/metrics';
import { getSecurityAlerts, resolveSecurityAlert } from '@/lib/monitoring/alert-manager';

vi.mock('@/lib/auth/middleware', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/utils/env', () => ({
  isProduction: vi.fn(),
}));

vi.mock('@/lib/lighthouse/redis', () => ({
  getLatestLighthouseReport: vi.fn(),
}));

vi.mock('@/lib/security/tests/security-tests', () => ({
  runSecurityTests: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/monitoring/metrics', () => ({
  getSecurityMetrics: vi.fn(),
}));

vi.mock('@/lib/monitoring/alert-manager', () => ({
  getSecurityAlerts: vi.fn(),
  resolveSecurityAlert: vi.fn(),
}));

describe('API Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isProduction).mockReturnValue(false);
  });

  describe('GET /api/monitoring/lighthouse', () => {
    it('devrait retourner 404 en production', async () => {
      vi.mocked(isProduction).mockReturnValue(true);

      const response = await lighthouseRoute.GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Not Found');
    });

    it('devrait retourner le rapport le plus récent pour un admin', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(undefined as any);
      vi.mocked(getLatestLighthouseReport).mockResolvedValue({
        timestamp: '2024-01-01T00:00:00.000Z',
        url: 'https://example.com',
        scores: {
          performance: 0.9,
          accessibility: 1,
          bestPractices: 0.8,
          seo: 0.95,
        },
        metrics: {
          fcp: null,
          lcp: null,
          tbt: null,
          speedIndex: null,
          cls: null,
        },
      } as any);

      const response = await lighthouseRoute.GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.report.scores.performance).toBe(0.9);
      expect(requireAdmin).toHaveBeenCalled();
    });
  });

  describe('GET /api/monitoring/tests', () => {
    it('devrait retourner les résultats récents', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(undefined as any);
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 'res1' }],
                error: null,
              }),
            }),
          }),
        }),
      };
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any);

      const response = await testsRoute.GET(new Request('http://localhost/api/monitoring/tests'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(1);
    });
  });

  describe('POST /api/monitoring/tests', () => {
    it('devrait exécuter les tests et les sauvegarder', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(undefined as any);
      vi.mocked(runSecurityTests).mockResolvedValue([
        {
          id: 'r1',
          testName: 'Security Headers',
          status: 'passed',
          timestamp: '2024-01-01',
          duration: 100,
        },
      ] as any);

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
      vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any);

      const response = await testsRoute.POST(
        new Request('http://localhost/api/monitoring/tests', { method: 'POST' }),
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(runSecurityTests).toHaveBeenCalled();
      expect(data.results).toHaveLength(1);
    });
  });

  describe('GET /api/monitoring/metrics', () => {
    it('devrait retourner les métriques de sécurité pour un admin', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(undefined as any);
      vi.mocked(getSecurityMetrics).mockResolvedValue({
        totalAlerts: 1,
        criticalAlerts: 0,
        highAlerts: 1,
        mediumAlerts: 0,
        lowAlerts: 0,
        alertsLast24h: 1,
        alertsLast7d: 1,
        topAlertTypes: [],
      });

      const response = await metricsRoute.GET(
        new Request('http://localhost/api/monitoring/metrics'),
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics.totalAlerts).toBe(1);
    });
  });

  describe('/api/monitoring/alerts', () => {
    it('GET devrait retourner les alertes avec filtres', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(undefined as any);
      vi.mocked(getSecurityAlerts).mockResolvedValue([
        {
          id: 'a1',
          type: 'rate_limit',
          level: 'high',
        },
      ] as any);

      const request = new Request(
        'http://localhost/api/monitoring/alerts?level=high&type=rate_limit&resolved=false&limit=10',
      );
      const response = await alertsRoute.GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.alerts).toHaveLength(1);
      expect(getSecurityAlerts).toHaveBeenCalledWith({
        level: 'high',
        type: 'rate_limit',
        resolved: false,
        limit: 10,
      });
    });

    it('PATCH devrait résoudre une alerte', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(undefined as any);

      const request = new Request('http://localhost/api/monitoring/alerts', {
        method: 'PATCH',
        body: JSON.stringify({ alertId: 'a1' }),
      });
      const response = await alertsRoute.PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(resolveSecurityAlert).toHaveBeenCalledWith('a1');
    });
  });
});



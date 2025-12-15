import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SecurityMonitoringPanel } from '../SecurityMonitoringPanel';

const fetchMock = vi.fn();

describe('SecurityMonitoringPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error override global
    global.fetch = fetchMock;

    // alerts + metrics
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        alerts: [
          {
            id: 'a1',
            message: 'Test alert',
            level: 'high',
            timestamp: new Date().toISOString(),
            resolved: false,
          },
        ],
      }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metrics: {
          totalAlerts: 1,
          criticalAlerts: 0,
          highAlerts: 1,
          mediumAlerts: 0,
          lowAlerts: 0,
          alertsLast24h: 1,
          alertsLast7d: 1,
          topAlertTypes: [],
        },
      }),
    });
  });

  it('affiche les métriques et la liste des alertes', async () => {
    render(<SecurityMonitoringPanel />);

    expect(
      await screen.findByText(/alertes de sécurité/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/test alert/i)).toBeInTheDocument();
  });

  it('permet de résoudre une alerte', async () => {
    // PATCH /api/monitoring/alerts
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    // reload alerts + metrics
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ alerts: [] }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metrics: {
          totalAlerts: 0,
          criticalAlerts: 0,
          highAlerts: 0,
          mediumAlerts: 0,
          lowAlerts: 0,
          alertsLast24h: 0,
          alertsLast7d: 0,
          topAlertTypes: [],
        },
      }),
    });

    render(<SecurityMonitoringPanel />);
    const resolveButton = await screen.findByRole('button', { name: /résoudre/i });
    fireEvent.click(resolveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/monitoring/alerts',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });
});



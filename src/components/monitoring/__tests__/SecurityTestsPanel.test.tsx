import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SecurityTestsPanel } from '../SecurityTestsPanel';

const fetchMock = vi.fn();

describe('SecurityTestsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error override global
    global.fetch = fetchMock;

    // GET /api/monitoring/tests
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: '1',
              testName: 'Security Headers',
              status: 'passed',
              timestamp: new Date().toISOString(),
              duration: 10,
            },
          ],
        }),
      })
      // GET /api/monitoring/lighthouse
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          report: null,
        }),
      });
  });

  it('affiche les résultats de tests existants', async () => {
    render(<SecurityTestsPanel />);

    expect(
      await screen.findByText(/security headers/i),
    ).toBeInTheDocument();
  });

  it('lance les tests via le bouton', async () => {
    // POST /api/monitoring/tests
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: '2',
            testName: 'Protected Routes',
            status: 'failed',
            timestamp: new Date().toISOString(),
            duration: 20,
            error: 'Oops',
          },
        ],
      }),
    });

    render(<SecurityTestsPanel />);

    const button = await screen.findByRole('button', { name: /tests sécurité/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/protected routes/i)).toBeInTheDocument();
    });
  });
});



import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGenealogyData } from '../use-genealogy-data';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('useGenealogyData', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error override global
    global.fetch = fetchMock;
  });

  it('initialise les personnes avec la valeur passée', () => {
    const { result } = renderHook(() =>
      useGenealogyData([{ id: 'p1' } as any], '/api/test'),
    );

    expect(result.current.persons).toHaveLength(1);
  });

  it('refreshData met à jour les personnes quand la requête réussit', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'p2' }],
    });

    const { result } = renderHook(() =>
      useGenealogyData([], '/api/test'),
    );

    await act(async () => {
      await result.current.refreshData();
    });

    expect(result.current.persons[0].id).toBe('p2');
    expect(result.current.isRefreshing).toBe(false);
  });

  it('addPerson retourne false si la requête échoue', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'bad' }),
    });

    const { result } = renderHook(() =>
      useGenealogyData([], '/api/test'),
    );

    const success = await result.current.addPerson({ id: 'p1' } as any);
    expect(success).toBe(false);
  });

  it('deletePerson retourne true quand la suppression réussit', async () => {
    fetchMock
      // delete
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'ok' }),
      })
      // refreshData
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    const { result } = renderHook(() =>
      useGenealogyData([], '/api/test'),
    );

    const success = await result.current.deletePerson('1');
    expect(success).toBe(true);
  });
});



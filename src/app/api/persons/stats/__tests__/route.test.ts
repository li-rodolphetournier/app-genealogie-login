/**
 * Tests pour la route /api/persons/stats
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../route';
import { createServiceRoleClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

const createServiceSupabaseMock = () => ({
  from: vi.fn(),
});

describe('/api/persons/stats', () => {
  const mockSupabase = createServiceSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any);
  });

  it('devrait grouper les personnes par date et inclure les créateurs', async () => {
    mockSupabase.from
      // persons
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'p1',
                nom: 'Dupont',
                prenom: 'Jean',
                created_at: '2024-01-10T10:00:00.000Z',
                created_by: 'u1',
              },
              {
                id: 'p2',
                nom: 'Martin',
                prenom: 'Anne',
                created_at: '2024-01-10T12:00:00.000Z',
                created_by: 'u1',
              },
            ],
            error: null,
          }),
        }),
      })
      // users
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              { id: 'u1', login: 'admin', email: 'admin@example.com' },
            ],
            error: null,
          }),
        }),
      } as any);

    const request = new Request('http://localhost/api/persons/stats?filter=all');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(2);
    expect(data.stats).toHaveLength(1);
    expect(data.stats[0].count).toBe(2);
    expect(data.stats[0].persons[0].creator?.login).toBe('admin');
  });
});



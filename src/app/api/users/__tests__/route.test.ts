/**
 * Tests pour la route /api/users (GET)
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

describe('/api/users', () => {
  const mockSupabase = createServiceSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any);
  });

  it('devrait retourner la liste des utilisateurs mappés', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'u1',
              login: 'user1',
              email: 'user1@example.com',
              status: 'utilisateur',
              profile_image: null,
              description: null,
              detail: null,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          ],
          error: null,
        }),
      }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].login).toBe('user1');
    expect(data[0].profileImage).toBeUndefined();
  });
});



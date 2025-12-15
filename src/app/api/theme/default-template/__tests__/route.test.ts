/**
 * Tests pour la route /api/theme/default-template
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT } from '../route';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/middleware';

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/auth/middleware', () => ({
  requireAdmin: vi.fn(),
}));

const createServiceSupabaseMock = () => ({
  from: vi.fn(),
});

describe('/api/theme/default-template', () => {
  const mockSupabase = createServiceSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any);
  });

  it('GET devrait retourner le template stocké ou le fallback', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { value: 'custom-template' },
            error: null,
          }),
        }),
      }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.template).toBe('custom-template');
  });

  it('PUT devrait mettre à jour le template pour un admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue(undefined as any);

    mockSupabase.from.mockReturnValueOnce({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    const request = new Request('http://localhost/api/theme/default-template', {
      method: 'PUT',
      body: JSON.stringify({ template: 'new-template' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.template).toBe('new-template');
  });
});



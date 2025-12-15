/**
 * Tests pour la route /api/messages
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '../route';
import { createServiceRoleClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

const createServiceSupabaseMock = () => ({
  from: vi.fn(),
});

describe('/api/messages', () => {
  const mockSupabase = createServiceSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any);
  });

  it('GET devrait retourner des messages avec images ordonnées', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'm1',
              title: 'Titre',
              content: 'Contenu',
              user_id: 'u1',
              display_on_home: true,
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
              message_images: [
                { id: 'i2', url: 'img2', display_order: 1 },
                { id: 'i1', url: 'img1', display_order: 0 },
              ],
            },
          ],
          error: null,
        }),
      }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].images).toEqual(['img1', 'img2']);
    expect(data[0].display_on_home).toBe(true);
  });

  it('POST devrait retourner 400 si les données sont invalides', async () => {
    const request = new Request('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify({ title: '' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});



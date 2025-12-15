/**
 * Tests pour la route /api/upload
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { uploadFile, ensureBucketExists, STORAGE_BUCKETS } from '@/lib/supabase/storage';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/storage', () => ({
  uploadFile: vi.fn(),
  ensureBucketExists: vi.fn(),
  STORAGE_BUCKETS: {
    MESSAGES: 'messages',
    OBJECTS: 'objects',
    USERS: 'users',
    GENEALOGY: 'genealogy',
    UPLOADS: 'uploads',
  },
}));

const createSupabaseMock = () => ({
  auth: {
    getUser: vi.fn(),
  },
});

const createFormDataRequest = (file: File | null, folder?: string) => {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (folder) formData.append('folder', folder);
  return new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  });
};

describe('/api/upload', () => {
  const mockSupabase = createSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it('devrait refuser si non authentifié', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'no session' },
    });

    const file = new File(['data'], 'image.png', { type: 'image/png' });
    const response = await POST(createFormDataRequest(file));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Non authentifié');
  });

  it('devrait refuser les fichiers trop volumineux', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1' } },
      error: null,
    });

    // Simuler un fichier > 10MB en surchargeant size
    const bigBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], {
      type: 'image/png',
    });
    const file = new File([bigBlob], 'big.png', { type: 'image/png' });

    const response = await POST(createFormDataRequest(file));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('trop volumineux');
  });

  it('devrait uploader une image valide dans le bon bucket', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u1' } },
      error: null,
    });

    const file = new File(['data'], 'image.png', { type: 'image/png' });

    vi.mocked(uploadFile).mockResolvedValue({
      publicUrl: 'https://storage/uploads/image.png',
      path: 'image.png',
    } as any);

    const response = await POST(createFormDataRequest(file, 'objects'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(ensureBucketExists).toHaveBeenCalledWith(STORAGE_BUCKETS.OBJECTS, true);
    expect(uploadFile).toHaveBeenCalled();
    expect(data.imageUrl).toContain('https://storage/uploads');
  });
});



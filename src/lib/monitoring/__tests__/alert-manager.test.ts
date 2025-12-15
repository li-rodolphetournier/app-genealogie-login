import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSecurityAlert, getSecurityAlerts, resolveSecurityAlert } from '../alert-manager';
import { createServiceRoleClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

describe('alert-manager', () => {
  const fromMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockResolvedValue({
      from: fromMock,
    } as any);
  });

  it('createSecurityAlert doit insérer une alerte dans security_alerts', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValueOnce({ insert });

    await createSecurityAlert('rate_limit' as any, 'high' as any, 'message', {
      ip: '127.0.0.1',
      userId: 'u1',
      userEmail: 'user@example.com',
      extra: 'x',
    });

    expect(fromMock).toHaveBeenCalledWith('security_alerts');
    expect(insert).toHaveBeenCalled();
  });

  it('getSecurityAlerts applique les filtres de niveau et type', async () => {
    const eq = vi.fn().mockReturnThis();
    const order = vi.fn().mockReturnThis();
    const limit = vi.fn().mockResolvedValue({ data: [], error: null });

    fromMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({ order, eq, limit }),
    });

    await getSecurityAlerts({
      level: 'high' as any,
      type: 'rate_limit' as any,
      resolved: false,
      limit: 10,
    });

    expect(fromMock).toHaveBeenCalledWith('security_alerts');
    expect(eq).toHaveBeenCalledWith('level', 'high');
  });

  it('resolveSecurityAlert met à jour le flag resolved', async () => {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    fromMock.mockReturnValueOnce({ update });

    await resolveSecurityAlert('alert-id');
    expect(update).toHaveBeenCalledWith({
      resolved: true,
      resolvedAt: expect.any(String),
    });
  });
});



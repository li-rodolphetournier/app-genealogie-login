import { describe, it, expect, vi, beforeEach } from 'vitest';

type MockRedis = {
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  lpush: ReturnType<typeof vi.fn>;
  ltrim: ReturnType<typeof vi.fn>;
  lrange: ReturnType<typeof vi.fn>;
};

describe('lighthouse/redis utils', () => {
  const mockRedis: MockRedis = {
    set: vi.fn(),
    get: vi.fn(),
    lpush: vi.fn(),
    ltrim: vi.fn(),
    lrange: vi.fn(),
  };

  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...envBackup };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...envBackup };
  });

  it('saveLighthouseReport retourne false quand Redis n’est pas configuré', async () => {
    const { saveLighthouseReport } = await import('../redis');

    const metadata = {
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
    };

    const result = await saveLighthouseReport(metadata);
    expect(result).toBe(false);
  });

  it('getLatestLighthouseReport doit retourner null si Redis n’est pas configuré', async () => {
    const { getLatestLighthouseReport } = await import('../redis');
    const result = await getLatestLighthouseReport();
    expect(result).toBeNull();
  });
});



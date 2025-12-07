/**
 * Configuration de setup pour Vitest
 */

import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Nettoyer après chaque test
afterEach(() => {
  cleanup();
});

// Mock pour Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock pour Next.js Image
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    // eslint-disable-next-line react/react-in-jsx-scope
    return React.createElement('img', props);
  },
}));

// Import React pour React.createElement
import React from 'react';


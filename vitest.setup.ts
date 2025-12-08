/**
 * Configuration de setup pour Vitest
 */

import '@testing-library/jest-dom';
import { afterEach, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Supprimer les console.error dans les tests (sauf si explicitement testés)
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: unknown[]) => {
    // Ne pas logger les erreurs dans les tests sauf si c'est une assertion
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      // Ignorer les warnings React et erreurs attendues dans les tests
      return;
    }
    originalError(...args);
  };
});

afterEach(() => {
  cleanup();
  // Restaurer console.error
  console.error = originalError;
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


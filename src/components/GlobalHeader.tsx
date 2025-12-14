'use client';

import { ThemeToggle } from './theme';

export function GlobalHeader() {
  return (
    <div className="fixed top-5 left-5 z-50">
      <ThemeToggle />
    </div>
  );
}


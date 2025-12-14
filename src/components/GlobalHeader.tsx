'use client';

import { ThemeToggle } from './ThemeToggle';

export function GlobalHeader() {
  return (
    <div className="fixed top-5 left-5 z-50">
      <ThemeToggle />
    </div>
  );
}


import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobalHeader } from '../GlobalHeader';

describe('GlobalHeader', () => {
  it('doit rendre le bouton de ThemeToggle', () => {
    // Mock minimal pour matchMedia utilisé dans useTheme
    (window as any).matchMedia = window.matchMedia || (() => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));

    render(<GlobalHeader />);

    // On vérifie la présence d'un bouton (ThemeToggle est déjà couvert par ses propres tests)
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});



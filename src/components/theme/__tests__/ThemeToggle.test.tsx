import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';

// Mock useTheme
const mockUseTheme = vi.fn(() => ({
  theme: 'light',
  toggleTheme: vi.fn(),
  mounted: true,
}));

vi.mock('@/hooks/use-theme', () => ({
  useTheme: () => mockUseTheme(),
}));

// Mock useAutoHide
vi.mock('@/hooks/use-auto-hide', () => ({
  useAutoHide: () => ({
    isVisible: true,
    show: vi.fn(),
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
  }),
}));

// Mock useThemeTransition
vi.mock('@/hooks/use-theme-transition', () => ({
  useThemeTransition: () => ({
    isTransitioning: false,
    transitionTheme: null,
    startTransition: vi.fn(),
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devrait rendre le switch quand mounted est true', async () => {
    render(<ThemeToggle />);
    
    const button = await screen.findByRole('button', { name: /passer en mode/i }, { timeout: 1000 });
    expect(button).toBeInTheDocument();
  });

  it('devrait afficher un placeholder quand mounted est false', () => {
    mockUseTheme.mockReturnValueOnce({
      theme: 'light',
      toggleTheme: vi.fn(),
      mounted: false,
    });

    render(<ThemeToggle />);
    
    const placeholder = document.querySelector('.w-14.h-8');
    expect(placeholder).toBeInTheDocument();
  });
});


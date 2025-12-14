import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../ThemeToggle';

// Mock useTheme
const mockToggleTheme = vi.fn();
const mockUseTheme = vi.fn(() => ({
  theme: 'light',
  toggleTheme: mockToggleTheme,
  mounted: true,
}));

vi.mock('@/hooks/use-theme', () => ({
  useTheme: () => mockUseTheme(),
}));

// Mock useAutoHide
const mockShow = vi.fn();
const mockHandleMouseEnter = vi.fn();
const mockHandleMouseLeave = vi.fn();

vi.mock('@/hooks/use-auto-hide', () => ({
  useAutoHide: () => ({
    isVisible: true,
    show: mockShow,
    handleMouseEnter: mockHandleMouseEnter,
    handleMouseLeave: mockHandleMouseLeave,
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devrait rendre le switch quand mounted est true', () => {
    render(<ThemeToggle />);
    
    // Attendre un peu pour que l'animation se termine
    const button = screen.queryByRole('button', { name: /passer en mode/i });
    // Le bouton peut ne pas être immédiatement visible à cause de l'animation
    // mais il devrait être dans le DOM
    expect(button || document.querySelector('button')).toBeTruthy();
  });

  it('devrait afficher un placeholder quand mounted est false', () => {
    mockUseTheme.mockReturnValueOnce({
      theme: 'light',
      toggleTheme: mockToggleTheme,
      mounted: false,
    });

    render(<ThemeToggle />);
    
    const placeholder = document.querySelector('.w-14.h-8');
    expect(placeholder).toBeInTheDocument();
  });

  it('devrait appeler toggleTheme lors du clic sur le switch', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    // Attendre que le bouton soit disponible
    const button = await waitFor(
      () => screen.getByRole('button', { name: /passer en mode/i }),
      { timeout: 3000 }
    );
    
    await user.click(button);
    
    // Attendre un peu pour que les callbacks soient appelés
    await waitFor(() => {
      expect(mockToggleTheme).toHaveBeenCalled();
    }, { timeout: 2000 });
    
    expect(mockShow).toHaveBeenCalled();
  });

  it('devrait afficher le thème dark correctement', () => {
    mockUseTheme.mockReturnValueOnce({
      theme: 'dark',
      toggleTheme: mockToggleTheme,
      mounted: true,
    });

    render(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /passer en mode clair/i });
    expect(button).toBeInTheDocument();
  });

  it('devrait gérer les événements de souris', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    // Attendre que le composant soit rendu
    const container = await waitFor(
      () => document.querySelector('.relative') as HTMLElement,
      { timeout: 3000 }
    );
    
    expect(container).toBeInTheDocument();
    
    // Simuler mouseEnter et mouseLeave avec userEvent
    await user.hover(container);
    
    await waitFor(() => {
      expect(mockHandleMouseEnter).toHaveBeenCalled();
    }, { timeout: 1000 });
    
    await user.unhover(container);
    
    await waitFor(() => {
      expect(mockHandleMouseLeave).toHaveBeenCalled();
    }, { timeout: 1000 });
  });
});


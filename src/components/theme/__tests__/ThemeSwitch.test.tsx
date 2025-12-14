import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeSwitch } from '../ThemeSwitch';

describe('ThemeSwitch', () => {
  it('devrait rendre le bouton quand isVisible est true', () => {
    const mockToggle = vi.fn();
    render(
      <ThemeSwitch
        isVisible={true}
        isDark={false}
        onToggle={mockToggle}
      />
    );
    
    const button = screen.getByRole('button', { name: /passer en mode sombre/i });
    expect(button).toBeInTheDocument();
  });

  it('ne devrait pas rendre le bouton quand isVisible est false', () => {
    const mockToggle = vi.fn();
    render(
      <ThemeSwitch
        isVisible={false}
        isDark={false}
        onToggle={mockToggle}
      />
    );
    
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('devrait appeler onToggle lors du clic', async () => {
    const user = userEvent.setup();
    const mockToggle = vi.fn();
    
    render(
      <ThemeSwitch
        isVisible={true}
        isDark={false}
        onToggle={mockToggle}
      />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('devrait afficher le bon aria-label pour le mode dark', () => {
    const mockToggle = vi.fn();
    render(
      <ThemeSwitch
        isVisible={true}
        isDark={true}
        onToggle={mockToggle}
      />
    );
    
    const button = screen.getByRole('button', { name: /passer en mode clair/i });
    expect(button).toBeInTheDocument();
  });

  it('devrait afficher le bon aria-label pour le mode light', () => {
    const mockToggle = vi.fn();
    render(
      <ThemeSwitch
        isVisible={true}
        isDark={false}
        onToggle={mockToggle}
      />
    );
    
    const button = screen.getByRole('button', { name: /passer en mode sombre/i });
    expect(button).toBeInTheDocument();
  });

  it('devrait avoir les bonnes classes CSS selon le thème', () => {
    const mockToggle = vi.fn();
    const { rerender } = render(
      <ThemeSwitch
        isVisible={true}
        isDark={false}
        onToggle={mockToggle}
      />
    );
    
    let button = screen.getByRole('button');
    expect(button.className).toContain('bg-gray-300');
    
    rerender(
      <ThemeSwitch
        isVisible={true}
        isDark={true}
        onToggle={mockToggle}
      />
    );
    
    button = screen.getByRole('button');
    expect(button.className).toContain('bg-blue-600');
  });
});


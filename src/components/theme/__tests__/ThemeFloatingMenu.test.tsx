import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeFloatingMenu } from '../ThemeFloatingMenu';

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    userStatus: 'administrateur',
    isLoading: false,
  }),
}));

const toggleTheme = vi.fn();
const setTemplate = vi.fn();
const applyGlobalTemplate = vi.fn();

vi.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme,
    template: 'default',
    setTemplate,
    applyGlobalTemplate,
    mounted: true,
  }),
}));

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('ThemeFloatingMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rend le bouton flottant pour un admin', () => {
    render(<ThemeFloatingMenu />);
    expect(
      screen.getByRole('button', { name: /ouvrir le menu de thème/i }),
    ).toBeInTheDocument();
  });

  it('ouvre le panneau quand on clique sur le bouton', () => {
    render(<ThemeFloatingMenu />);
    fireEvent.click(screen.getByRole('button', { name: /ouvrir le menu de thème/i }));

    expect(
      screen.getByRole('heading', { name: /personnalisation du thème/i }),
    ).toBeInTheDocument();
  });
});



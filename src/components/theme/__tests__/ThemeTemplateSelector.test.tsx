import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeTemplateSelector } from '../ThemeTemplateSelector';

const setTemplate = vi.fn();

vi.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    template: 'default',
    setTemplate,
    mounted: true,
  }),
}));

describe('ThemeTemplateSelector', () => {
  it('ne rend rien pour un non-admin', () => {
    const { container } = render(<ThemeTemplateSelector isAdmin={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('affiche le bouton et ouvre la liste des templates', () => {
    render(<ThemeTemplateSelector isAdmin />);

    const button = screen.getByRole('button', {
      name: /sélectionner un template de thème/i,
    });
    fireEvent.click(button);

    const items = screen.getAllByText(/par défaut/i);
    expect(items.length).toBeGreaterThan(0);
  });
});



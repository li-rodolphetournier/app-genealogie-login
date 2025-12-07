/**
 * Tests unitaires pour LoadingIndicator
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingIndicator from '../LoadingIndicator';

describe('LoadingIndicator', () => {
  it('devrait afficher le texte par défaut', () => {
    render(<LoadingIndicator />);
    
    // Le texte apparaît deux fois (visible et sr-only), utiliser getAllByText
    const texts = screen.getAllByText('Chargement...');
    expect(texts.length).toBeGreaterThan(0);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('devrait afficher un texte personnalisé', () => {
    render(<LoadingIndicator text="Chargement des données..." />);
    
    // Le texte apparaît deux fois (visible et sr-only), utiliser getAllByText
    const texts = screen.getAllByText('Chargement des données...');
    expect(texts.length).toBeGreaterThan(0);
  });

  it('devrait avoir les attributs ARIA appropriés', () => {
    render(<LoadingIndicator />);
    
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('devrait avoir un texte caché pour les lecteurs d\'écran', () => {
    render(<LoadingIndicator text="Custom text" />);
    
    const srOnly = screen.getByText('Custom text', { selector: '.sr-only' });
    expect(srOnly).toBeInTheDocument();
  });

  it('devrait accepter des classes personnalisées', () => {
    const { container } = render(
      <LoadingIndicator className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});


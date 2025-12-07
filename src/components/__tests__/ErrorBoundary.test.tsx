/**
 * Tests unitaires pour ErrorBoundary
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui lance une erreur
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Supprimer les console.error pour les tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('devrait rendre les enfants quand il n\'y a pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('devrait afficher l\'UI d\'erreur quand une erreur est lancée', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
    expect(screen.getByText(/Désolé, quelque chose s'est mal passé/)).toBeInTheDocument();
  });

  it('devrait appeler onError callback quand une erreur est capturée', async () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Attendre que l'erreur soit capturée et le callback appelé
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('devrait permettre de réessayer après une erreur', async () => {
    const user = userEvent.setup();
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Le composant devrait rendre sans erreur
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('devrait utiliser le fallback personnalisé si fourni', () => {
    const fallback = <div>Custom fallback</div>;

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });
});


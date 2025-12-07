/**
 * Tests unitaires pour ToastProvider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../ToastProvider';

// Composant de test qui utilise useToast
const TestComponent = () => {
  const { showToast, showConfirm } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Test message', 'success')}>
        Show Toast
      </button>
      <button onClick={() => showConfirm('Confirm?')}>
        Show Confirm
      </button>
    </div>
  );
};

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    window.confirm = vi.fn(() => true);
  });

  it('devrait fournir le contexte useToast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Show Toast')).toBeInTheDocument();
    expect(screen.getByText('Show Confirm')).toBeInTheDocument();
  });

  it('devrait lancer une erreur si useToast est utilisé sans ToastProvider', () => {
    // Supprimer console.error pour le test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useToast must be used within ToastProvider');

    console.error = originalError;
  });

  it('devrait afficher un toast quand showToast est appelé', async () => {
    const user = userEvent.setup();
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Toast'));

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('devrait appeler window.confirm quand showConfirm est appelé', async () => {
    const user = userEvent.setup();
    
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Confirm'));

    expect(window.confirm).toHaveBeenCalledWith('Confirm?');
  });
});


import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IdleWarning } from '../auth/IdleWarning';

describe('IdleWarning', () => {
  vi.useFakeTimers();

  it('doit afficher le compte à rebours formaté', () => {
    render(<IdleWarning onStayActive={vi.fn()} onLogout={vi.fn()} secondsRemaining={125} />);

    expect(screen.getByText('02:05')).toBeInTheDocument();
  });

  it('doit appeler onStayActive quand on clique sur le bouton Rester connecté', () => {
    const onStayActive = vi.fn();
    render(<IdleWarning onStayActive={onStayActive} onLogout={vi.fn()} secondsRemaining={60} />);

    fireEvent.click(screen.getByRole('button', { name: /rester connecté/i }));
    expect(onStayActive).toHaveBeenCalled();
  });

  it('doit appeler onLogout automatiquement quand le compte à rebours atteint 0', () => {
    const onLogout = vi.fn();
    render(<IdleWarning onStayActive={vi.fn()} onLogout={onLogout} secondsRemaining={2} />);

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(onLogout).toHaveBeenCalled();
  });
});



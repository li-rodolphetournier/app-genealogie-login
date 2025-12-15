import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionTimeoutProvider } from '../auth/SessionTimeoutProvider';
import { useSessionTimeout } from '@/hooks/use-session-timeout';

vi.mock('@/hooks/use-session-timeout', () => ({
  useSessionTimeout: vi.fn(),
}));

vi.mock('../auth/IdleWarning', () => ({
  IdleWarning: ({ secondsRemaining }: { secondsRemaining: number }) => (
    <div>Idle warning: {secondsRemaining}</div>
  ),
}));

describe('SessionTimeoutProvider', () => {
  it('ne doit rien rendre quand showWarning est false', () => {
    vi.mocked(useSessionTimeout).mockReturnValue({
      showWarning: false,
      secondsRemaining: 0,
      handleStayActive: vi.fn(),
      handleLogout: vi.fn(),
    });

    const { container } = render(<SessionTimeoutProvider />);
    expect(container.firstChild).toBeNull();
  });

  it('doit rendre IdleWarning quand showWarning est true', () => {
    vi.mocked(useSessionTimeout).mockReturnValue({
      showWarning: true,
      secondsRemaining: 42,
      handleStayActive: vi.fn(),
      handleLogout: vi.fn(),
    });

    render(<SessionTimeoutProvider />);
    expect(screen.getByText(/idle warning/i)).toBeInTheDocument();
  });
});



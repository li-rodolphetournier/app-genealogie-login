import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDeleteModal from '../ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ne doit rien rendre quand isOpen est false', () => {
    const { container } = render(
      <ConfirmDeleteModal isOpen={false} onClose={onClose} onConfirm={onConfirm} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('doit afficher le titre et le message par défaut quand isOpen est true', () => {
    render(<ConfirmDeleteModal isOpen onClose={onClose} onConfirm={onConfirm} />);

    expect(
      screen.getByRole('heading', { name: /confirmer la suppression/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/êtes-vous sûr de vouloir supprimer cet élément/i),
    ).toBeInTheDocument();
  });

  it('doit appeler onClose lors du clic sur le fond', () => {
    render(<ConfirmDeleteModal isOpen onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('doit appeler onConfirm lors du clic sur le bouton Supprimer', () => {
    render(<ConfirmDeleteModal isOpen onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});



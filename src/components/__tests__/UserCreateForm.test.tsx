import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserCreateForm from '../UserCreateForm';

const fetchMock = vi.fn();

describe('UserCreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error override
    global.fetch = fetchMock;
  });

  const fillMinimalForm = () => {
    fireEvent.change(screen.getByLabelText(/login/i), {
      target: { value: 'alice' },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: 'password123' },
    });
  };

  it('affiche une erreur si le mot de passe est trop court', async () => {
    render(<UserCreateForm />);

    fireEvent.change(screen.getByLabelText(/login/i), {
      target: { value: 'alice' },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: '123' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /créer l utilisateur/i }));

    expect(
      await screen.findByText(/mot de passe doit contenir au moins 6 caractères/i),
    ).toBeInTheDocument();
  });

  it('soumet le formulaire et affiche un message de succès', async () => {
    render(<UserCreateForm />);
    fillMinimalForm();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    fireEvent.submit(screen.getByRole('button', { name: /créer l utilisateur/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('affiche une erreur si le fichier de profil n’est pas une image', async () => {
    render(<UserCreateForm />);

    const fileInput = document.querySelector(
      'input#profileImage[type="file"]',
    ) as HTMLInputElement;

    const file = new File(['abc'], 'doc.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      await screen.findByText(/veuillez sélectionner un fichier image valide/i),
    ).toBeInTheDocument();
  });
});



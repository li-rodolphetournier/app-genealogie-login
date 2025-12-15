import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GenealogyForm } from '../genealogy/GenealogyForm';
import type { Person } from '@/types/genealogy';

const basePerson: Omit<Person, 'id'> = {
  nom: '',
  prenom: '',
  genre: 'homme',
  description: '',
  mere: null,
  pere: null,
  ordreNaissance: 1,
  dateNaissance: '2000-01-01',
  dateDeces: null,
  image: null,
};

const persons: Person[] = [
  {
    id: 'p1',
    nom: 'Dupont',
    prenom: 'Jean',
    genre: 'homme',
    description: '',
    mere: null,
    pere: null,
    ordreNaissance: 1,
    dateNaissance: '1980-01-01',
    dateDeces: null,
    image: null,
  },
];

describe('GenealogyForm', () => {
  it('doit appeler onSubmit lors de la soumission', () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    const onInputChange = vi.fn();

    const { container } = render(
      <GenealogyForm
        formData={basePerson}
        isEditing={false}
        editingId={null}
        persons={persons}
        onInputChange={onInputChange}
        onImageUploadSuccess={vi.fn()}
        onImageUploadError={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('doit ouvrir puis confirmer la suppression en mode édition', () => {
    const onDelete = vi.fn();
    const onInputChange = vi.fn();

    render(
      <GenealogyForm
        formData={basePerson}
        isEditing
        editingId="p1"
        persons={persons}
        onInputChange={onInputChange}
        onImageUploadSuccess={vi.fn()}
        onImageUploadError={vi.fn()}
        onSubmit={(e) => e.preventDefault()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /supprimer cette personne/i }),
    );
    // Le texte de la modal contient le nom de la personne dans la description de la modale
    expect(screen.getAllByText(/dupont/i).length).toBeGreaterThan(0);

    // Le bouton "Supprimer" de la modal est distinct du bouton de la fiche
    const modalButtons = screen.getAllByRole('button', { name: /supprimer/i });
    fireEvent.click(modalButtons[modalButtons.length - 1]);
    expect(onDelete).toHaveBeenCalledWith('p1');
  });
});



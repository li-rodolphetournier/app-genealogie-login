/**
 * Tests unitaires pour ObjectCard
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ObjectData } from '@/types/objects';
import { ObjectCard } from '../ObjectCard';

describe('ObjectCard', () => {
  const mockObject: ObjectData = {
    id: '1',
    nom: 'Test Object',
    type: 'livre',
    status: 'publie',
    utilisateur: 'testuser',
    description: 'Test description',
    photos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('devrait afficher les informations de l\'objet', () => {
    render(<ObjectCard object={mockObject} />);
    
    expect(screen.getByText('Test Object')).toBeInTheDocument();
    expect(screen.getByText(/Type: livre/)).toBeInTheDocument();
    expect(screen.getByText(/Par: testuser/)).toBeInTheDocument();
  });

  it('devrait afficher le statut', () => {
    render(<ObjectCard object={mockObject} />);
    
    expect(screen.getByText('Publié')).toBeInTheDocument();
  });

  it('devrait appeler onDelete quand le bouton supprimer est cliqué', () => {
    const handleDelete = vi.fn();
    render(<ObjectCard object={mockObject} onDelete={handleDelete} canEdit={true} />);
    
    const deleteButton = screen.getByLabelText('Supprimer Test Object');
    deleteButton.click();
    
    expect(handleDelete).toHaveBeenCalledWith('1');
  });
});


/**
 * Tests unitaires pour UserCard
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserCard } from '../UserCard';
import type { User } from '@/types/user';

describe('UserCard', () => {
  const mockUser: User = {
    id: '1',
    login: 'testuser',
    email: 'test@example.com',
    status: 'utilisateur',
    description: 'Test description',
    profileImage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('devrait afficher les informations de l\'utilisateur', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('devrait afficher le statut', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('utilisateur')).toBeInTheDocument();
  });

  it('devrait appeler onDelete quand le bouton supprimer est cliqué', () => {
    const handleDelete = vi.fn();
    render(<UserCard user={mockUser} onDelete={handleDelete} />);
    
    const deleteButton = screen.getByLabelText('Supprimer testuser');
    deleteButton.click();
    
    expect(handleDelete).toHaveBeenCalledWith('testuser');
  });

  it('ne devrait pas afficher le bouton supprimer si onDelete n\'est pas fourni', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.queryByLabelText(/Supprimer/)).not.toBeInTheDocument();
  });

  it('devrait afficher une image de profil si fournie', () => {
    const userWithImage = {
      ...mockUser,
      profileImage: 'https://example.com/image.jpg',
    };
    
    render(<UserCard user={userWithImage} />);
    
    const image = screen.getByAltText('Photo de profil de testuser');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });
});


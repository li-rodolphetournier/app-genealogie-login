import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageTransition } from '../animations/PageTransition';

describe('PageTransition', () => {
  it('doit rendre ses enfants', () => {
    render(
      <PageTransition>
        <div>Contenu</div>
      </PageTransition>,
    );

    expect(screen.getByText('Contenu')).toBeInTheDocument();
  });
});



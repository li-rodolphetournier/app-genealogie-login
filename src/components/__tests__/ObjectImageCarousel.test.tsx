import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ObjectImageCarousel } from '../carousel/ObjectImageCarousel';

vi.mock('embla-carousel-react', () => {
  const api = {
    scrollTo: vi.fn(),
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    selectedScrollSnap: () => 0,
    scrollSnapList: () => [0, 1],
    on: vi.fn(),
    off: vi.fn(),
  };
  const refCallback = vi.fn();
  return {
    __esModule: true,
    default: () => [refCallback, api] as const,
  };
});

describe('ObjectImageCarousel', () => {
  it('affiche un placeholder quand aucune photo', () => {
    render(<ObjectImageCarousel photos={[]} objectName="Objet X" />);
    // On vérifie simplement qu'un conteneur avec la classe aspect-square est présent
    const container = document.querySelector('.aspect-square');
    expect(container).not.toBeNull();
  });

  it('affiche les photos quand elles sont présentes', () => {
    render(
      <ObjectImageCarousel
        photos={[
          { id: 'p1', url: '/p1.png', description: ['a'], display_order: 0 },
          { id: 'p2', url: '/p2.png', description: ['b'], display_order: 1 },
        ]}
        objectName="Mon objet"
      />,
    );

    expect(screen.getAllByAltText(/mon objet/i).length).toBeGreaterThan(0);
  });
});



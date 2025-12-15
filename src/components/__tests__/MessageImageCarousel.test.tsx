import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageImageCarousel } from '../carousel/MessageImageCarousel';

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

describe('MessageImageCarousel', () => {
  it('retourne null si aucune image', () => {
    const { container } = render(<MessageImageCarousel images={[]} messageTitle="msg" />);
    expect(container.firstChild).toBeNull();
  });

  it('affiche une seule image sans carousel quand il n’y a qu’une image', () => {
    render(<MessageImageCarousel images={['/img1.png']} messageTitle="msg" />);
    expect(screen.getByAltText(/image du message/i)).toBeInTheDocument();
  });

  it('affiche les miniatures quand plusieurs images', () => {
    render(
      <MessageImageCarousel
        images={['/img1.png', '/img2.png']}
        messageTitle="message de test"
      />,
    );

    const thumbs = screen.getAllByRole('button', { name: /voir l'image/i });
    expect(thumbs).toHaveLength(2);
    fireEvent.click(thumbs[1]);
  });
});



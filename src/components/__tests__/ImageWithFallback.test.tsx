import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImageWithFallback from '../ImageWithFallback';

describe('ImageWithFallback', () => {
  it('doit afficher le fallback par défaut quand src est vide', () => {
    render(<ImageWithFallback src={null} alt="test" />);

    // Le fallback par défaut rend un conteneur avec un svg, on vérifie juste le conteneur
    const container = screen.getByText((content, element) =>
      element?.tagName.toLowerCase() === 'div' &&
      element.className.includes('bg-gray-200'),
    );
    expect(container).toBeInTheDocument();
  });

  it('doit rendre une image quand src est fourni', () => {
    render(<ImageWithFallback src="/test.png" alt="image de test" width={100} height={100} />);

    const img = screen.getByAltText('image de test');
    expect(img).toBeInTheDocument();
  });
});



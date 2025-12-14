import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeIcon } from '../ThemeIcon';

describe('ThemeIcon', () => {
  it('devrait rendre l\'icône de lune pour le mode dark', () => {
    const { container } = render(<ThemeIcon isDark={true} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20');
  });

  it('devrait rendre l\'icône de soleil pour le mode light', () => {
    const { container } = render(<ThemeIcon isDark={false} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20');
  });

  it('devrait accepter une className personnalisée', () => {
    const { container } = render(<ThemeIcon isDark={true} className="custom-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });
});


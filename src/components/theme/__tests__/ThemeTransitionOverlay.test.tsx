import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeTransitionOverlay } from '../ThemeTransitionOverlay';

describe('ThemeTransitionOverlay', () => {
  it('ne devrait rien rendre quand isTransitioning est false', () => {
    const { container } = render(
      <ThemeTransitionOverlay
        isTransitioning={false}
        theme={null}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('ne devrait rien rendre quand theme est null', () => {
    const { container } = render(
      <ThemeTransitionOverlay
        isTransitioning={true}
        theme={null}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('devrait rendre l\'overlay quand isTransitioning est true et theme est défini', () => {
    const { container } = render(
      <ThemeTransitionOverlay
        isTransitioning={true}
        theme="dark"
      />
    );
    
    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
  });

  it('devrait avoir le bon background pour le thème dark', () => {
    const { container } = render(
      <ThemeTransitionOverlay
        isTransitioning={true}
        theme="dark"
      />
    );
    
    const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
    expect(overlay).toBeInTheDocument();
    expect(overlay.style.background).toContain('rgba(0, 0, 0');
  });

  it('devrait avoir le bon background pour le thème light', () => {
    const { container } = render(
      <ThemeTransitionOverlay
        isTransitioning={true}
        theme="light"
      />
    );
    
    const overlay = container.querySelector('.fixed.inset-0') as HTMLElement;
    expect(overlay).toBeInTheDocument();
    expect(overlay.style.background).toContain('rgba(255, 255, 255');
  });

  it('devrait utiliser la position fournie', () => {
    const position = { x: 100, y: 200 };
    const { container } = render(
      <ThemeTransitionOverlay
        isTransitioning={true}
        theme="dark"
        position={position}
      />
    );
    
    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
  });
});


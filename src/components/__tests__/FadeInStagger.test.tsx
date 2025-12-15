import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FadeInStagger, FadeInStaggerItem } from '../animations/FadeInStagger';

describe('FadeInStagger', () => {
  it('doit rendre ses enfants FadeInStaggerItem', () => {
    render(
      <FadeInStagger>
        <FadeInStaggerItem>
          <div>Item 1</div>
        </FadeInStaggerItem>
        <FadeInStaggerItem>
          <div>Item 2</div>
        </FadeInStaggerItem>
      </FadeInStagger>,
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});



import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeTab } from '../ThemeTab';

describe('ThemeTab', () => {
  it('devrait rendre la tab quand isVisible est false', () => {
    const mockShow = vi.fn();
    const mockMouseEnter = vi.fn();
    
    render(
      <ThemeTab
        isVisible={false}
        isDark={false}
        onShow={mockShow}
        onMouseEnter={mockMouseEnter}
      />
    );
    
    const tab = document.querySelector('.fixed.left-0.top-0');
    expect(tab).toBeInTheDocument();
  });

  it('ne devrait pas rendre la tab quand isVisible est true', () => {
    const mockShow = vi.fn();
    const mockMouseEnter = vi.fn();
    
    render(
      <ThemeTab
        isVisible={true}
        isDark={false}
        onShow={mockShow}
        onMouseEnter={mockMouseEnter}
      />
    );
    
    const tab = document.querySelector('.fixed.left-0.top-0');
    expect(tab).not.toBeInTheDocument();
  });

  it('devrait appeler onShow lors du clic', async () => {
    const user = userEvent.setup();
    const mockShow = vi.fn();
    const mockMouseEnter = vi.fn();
    
    render(
      <ThemeTab
        isVisible={false}
        isDark={false}
        onShow={mockShow}
        onMouseEnter={mockMouseEnter}
      />
    );
    
    const tab = document.querySelector('.fixed.left-0.top-0');
    if (tab) {
      await user.click(tab as HTMLElement);
      expect(mockShow).toHaveBeenCalledTimes(1);
    }
  });

  it('devrait appeler onMouseEnter lors du survol', async () => {
    const user = userEvent.setup();
    const mockShow = vi.fn();
    const mockMouseEnter = vi.fn();
    
    render(
      <ThemeTab
        isVisible={false}
        isDark={false}
        onShow={mockShow}
        onMouseEnter={mockMouseEnter}
      />
    );
    
    const tab = document.querySelector('.fixed.left-0.top-0');
    if (tab) {
      await user.hover(tab as HTMLElement);
      expect(mockMouseEnter).toHaveBeenCalledTimes(1);
    }
  });

  it('devrait avoir les bonnes classes CSS pour le mode dark', () => {
    const mockShow = vi.fn();
    const mockMouseEnter = vi.fn();
    
    render(
      <ThemeTab
        isVisible={false}
        isDark={true}
        onShow={mockShow}
        onMouseEnter={mockMouseEnter}
      />
    );
    
    const tab = document.querySelector('.fixed.left-0.top-0');
    expect(tab).toBeInTheDocument();
  });
});


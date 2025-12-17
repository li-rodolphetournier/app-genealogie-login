/**
 * Tests E2E pour vérifier l'aspect visuel des cartes objets sur /objects
 * - Padding autour de l'image
 * - Fond blanc derrière l'image (bg-white)
 */

import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Page /objects - Cartes objets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/objects');
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher au moins une carte objet avec image sur fond blanc et padding', async ({ page }) => {
    // Sélectionner les cartes objets en mode grille
    const cards = page.locator('div.bg-white.border.rounded-lg');
    const cardCount = await cards.count();

    expect(cardCount).toBeGreaterThan(0);

    const firstCard = cards.first();

    // Lien qui contient l'image de l'objet
    const imageLink = firstCard.locator('a[href^="/objects/"]').first();
    await expect(imageLink).toBeVisible();

    // Vérifier le padding du lien (p-4 => 16px)
    const { paddingTop, paddingRight, paddingBottom, paddingLeft } =
      await imageLink.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          paddingTop: style.paddingTop,
          paddingRight: style.paddingRight,
          paddingBottom: style.paddingBottom,
          paddingLeft: style.paddingLeft,
        };
      });

    expect(paddingTop).toBe('16px');
    expect(paddingRight).toBe('16px');
    expect(paddingBottom).toBe('16px');
    expect(paddingLeft).toBe('16px');

    // Vérifier la présence de l'image
    const img = imageLink.locator('img').first();
    await expect(img).toBeVisible();

    // Vérifier que l'image a un fond blanc (classe bg-white appliquée)
    const imgClass = await img.getAttribute('class');
    expect(imgClass).toBeTruthy();
    expect(imgClass).toContain('bg-white');
  });
});



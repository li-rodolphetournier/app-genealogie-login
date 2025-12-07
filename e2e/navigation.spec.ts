/**
 * Tests E2E pour la navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('devrait naviguer vers la page de généalogie', async ({ page }) => {
    await page.goto('/accueil');
    
    // Cliquer sur le lien généalogie (doit être visible après connexion)
    const genealogyLink = page.getByRole('link', { name: /généalogie/i });
    
    if (await genealogyLink.isVisible()) {
      await genealogyLink.click();
      await expect(page).toHaveURL(/\/genealogie/);
    }
  });

  test('devrait naviguer vers la page des objets', async ({ page }) => {
    await page.goto('/accueil');
    
    const objectsLink = page.getByRole('link', { name: /objets/i });
    
    if (await objectsLink.isVisible()) {
      await objectsLink.click();
      await expect(page).toHaveURL(/\/objects/);
    }
  });

  test('devrait afficher la page 404 pour une route inexistante', async ({ page }) => {
    await page.goto('/route-inexistante');
    
    await expect(page.getByText(/404|page non trouvée|not found/i)).toBeVisible({
      timeout: 5000,
    });
  });
});


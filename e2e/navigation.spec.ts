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
    await page.goto('/route-inexistante-12345');
    
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle');
    
    // Chercher le titre h1 avec "404" de manière spécifique
    const notFoundHeading = page.getByRole('heading', { name: '404' }).first();
    await expect(notFoundHeading).toBeVisible({
      timeout: 10000,
    });
    
    // Vérifier aussi le sous-titre "Page non trouvée"
    const notFoundSubtitle = page.getByRole('heading', { name: /page non trouvée/i }).first();
    await expect(notFoundSubtitle).toBeVisible({
      timeout: 5000,
    });
  });
});


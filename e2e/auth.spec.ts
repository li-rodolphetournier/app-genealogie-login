/**
 * Tests E2E pour l'authentification
 */

import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('devrait afficher le formulaire de connexion', async ({ page }) => {
    await expect(page.getByLabel(/login|nom d'utilisateur/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /connexion|connecter/i })).toBeVisible();
  });

  test('devrait afficher une erreur avec des identifiants invalides', async ({ page }) => {
    await page.getByLabel(/login|nom d'utilisateur/i).fill('invalid-user');
    await page.getByLabel(/mot de passe|password/i).fill('invalid-password');
    await page.getByRole('button', { name: /connexion|connecter/i }).click();

    // Attendre qu'un message d'erreur apparaisse
    await expect(page.locator('text=/erreur|invalid|incorrect/i').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('devrait rediriger vers l\'accueil après connexion réussie', async ({ page }) => {
    // Note: Ce test nécessite des identifiants valides dans l'environnement de test
    const validLogin = process.env.TEST_USER_LOGIN || 'admin';
    const validPassword = process.env.TEST_USER_PASSWORD || 'admin123';

    await page.getByLabel(/login|nom d'utilisateur/i).fill(validLogin);
    await page.getByLabel(/mot de passe|password/i).fill(validPassword);
    await page.getByRole('button', { name: /connexion|connecter/i }).click();

    // Attendre la redirection vers /accueil
    await expect(page).toHaveURL(/\/accueil/, { timeout: 10000 });
  });
});


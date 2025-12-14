/**
 * Tests E2E pour l'authentification
 */

import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    // S'assurer qu'on n'est pas déjà connecté en supprimant la session
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/');
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher le formulaire de connexion', async ({ page }) => {
    // Attendre que le formulaire soit visible (la page peut avoir une animation)
    await page.waitForTimeout(1000);
    
    // Utiliser les IDs ou les labels réels
    const loginInput = page.locator('input#login').or(page.getByLabel(/identifiant/i));
    const passwordInput = page.locator('input#password').or(page.getByLabel(/mot de passe/i));
    const submitButton = page.getByRole('button', { name: /connexion|connecter|se connecter/i });
    
    await expect(loginInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(submitButton).toBeVisible({ timeout: 10000 });
  });

  test('devrait afficher une erreur avec des identifiants invalides', async ({ page }) => {
    // Attendre que le formulaire soit visible
    await page.waitForTimeout(1000);
    
    // Utiliser les IDs ou les sélecteurs réels
    const loginInput = page.locator('input#login').or(page.getByLabel(/identifiant/i));
    const passwordInput = page.locator('input#password').or(page.getByLabel(/mot de passe/i));
    const submitButton = page.getByRole('button', { name: /connexion|connecter|se connecter/i });
    
    await loginInput.fill('invalid-user');
    await passwordInput.fill('invalid-password');
    await submitButton.click();

    // Attendre qu'un message d'erreur apparaisse
    await expect(page.locator('text=/erreur|invalid|incorrect|identifiants|credentials/i').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('devrait rediriger vers l\'accueil après connexion réussie', async ({ page }) => {
    // Note: Ce test nécessite des identifiants valides dans l'environnement de test
    // Utiliser le helper de connexion
    await login(page);
    
    // Vérifier qu'on est bien sur la page d'accueil
    await expect(page).toHaveURL(/\/accueil/);
    await expect(page.getByRole('heading', { name: /tableau de bord/i })).toBeVisible();
  });
});


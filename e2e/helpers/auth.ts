/**
 * Helper pour les tests d'authentification E2E
 */

import { Page, expect } from '@playwright/test';

/**
 * Se connecter à l'application
 */
export async function login(
  page: Page,
  loginValue: string = process.env.TEST_USER_LOGIN || 'admin',
  password: string = process.env.TEST_USER_PASSWORD || 'admin123'
): Promise<void> {
  // S'assurer qu'on n'est pas déjà connecté
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Attendre que le formulaire soit visible
  await page.waitForTimeout(1000);
  
  // Utiliser les IDs réels
  const loginInput = page.locator('input#login');
  const passwordInput = page.locator('input#password');
  
  // Attendre que les champs soient visibles
  await expect(loginInput).toBeVisible({ timeout: 10000 });
  await expect(passwordInput).toBeVisible({ timeout: 10000 });
  
  // Remplir le formulaire
  await loginInput.fill(loginValue);
  await passwordInput.fill(password);
  
  // Cliquer sur le bouton de connexion
  const submitButton = page.getByRole('button', { name: /connexion|connecter|se connecter/i });
  await submitButton.click();
  
  // Attendre un peu pour que la requête démarre
  await page.waitForTimeout(1000);
  
  // Vérifier s'il y a une erreur (attendre un peu plus longtemps)
  const errorMessage = page.locator('text=/erreur|invalid|incorrect|identifiants|credentials|échec|failed/i');
  const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (hasError) {
    const errorText = await errorMessage.textContent();
    // Prendre un screenshot pour debug
    await page.screenshot({ path: 'test-results/login-error.png', fullPage: true });
    throw new Error(`Erreur de connexion détectée: ${errorText}`);
  }
  
  // Vérifier si on est toujours sur la page de login après 3 secondes
  await page.waitForTimeout(3000);
  const currentURL = page.url();
  
  if (currentURL.includes('/accueil')) {
    // Déjà redirigé, c'est bon
    return;
  }
  
  // Si on est toujours sur "/", vérifier s'il y a un message d'erreur ou un problème
  if (currentURL === 'http://localhost:3000/' || currentURL.endsWith('/')) {
    // Vérifier à nouveau les erreurs
    const errorAfterWait = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
    if (errorAfterWait) {
      const errorText = await errorMessage.textContent();
      await page.screenshot({ path: 'test-results/login-error-after-wait.png', fullPage: true });
      throw new Error(`Erreur de connexion après attente: ${errorText}`);
    }
    
    // Vérifier si le formulaire est toujours visible (signe que la connexion a échoué)
    const loginInputStillVisible = await page.locator('input#login').isVisible({ timeout: 2000 }).catch(() => false);
    if (loginInputStillVisible) {
      // Prendre un screenshot pour debug
      await page.screenshot({ path: 'test-results/login-still-on-page.png', fullPage: true });
      // Vérifier la console pour des erreurs
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      throw new Error(`La connexion a échoué - toujours sur la page de login. Console errors: ${consoleErrors.join(', ')}`);
    }
  }
  
  // Attendre la redirection (peut prendre du temps)
  await expect(page).toHaveURL(/\/accueil/, { timeout: 20000 });
  
  // Attendre que le dashboard soit chargé
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /tableau de bord/i })).toBeVisible({ timeout: 15000 });
}

/**
 * Se déconnecter de l'application
 */
export async function logout(page: Page): Promise<void> {
  // Chercher le bouton de déconnexion
  const logoutButton = page.getByRole('button', { name: /déconnexion|logout|se déconnecter/i });
  const isVisible = await logoutButton.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (isVisible) {
    await logoutButton.click();
    await page.waitForURL(/\/$/, { timeout: 10000 });
  }
  
  // Nettoyer le storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}


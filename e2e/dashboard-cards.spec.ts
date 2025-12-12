/**
 * Tests E2E pour vérifier l'affichage des cartes du dashboard
 * Diagnostic du problème d'opacité
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard - Affichage des cartes', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter d'abord
    const validLogin = process.env.TEST_USER_LOGIN || 'admin';
    const validPassword = process.env.TEST_USER_PASSWORD || 'admin123';

    await page.goto('/');
    
    // Attendre que le formulaire soit visible
    await page.waitForSelector('input[name="login"]', { timeout: 5000 });
    
    await page.getByLabel(/login|nom d'utilisateur/i).fill(validLogin);
    await page.getByLabel(/mot de passe|password/i).fill(validPassword);
    await page.getByRole('button', { name: /connexion|connecter/i }).click();

    // Attendre la redirection vers /accueil
    await expect(page).toHaveURL(/\/accueil/, { timeout: 10000 });
    
    // Attendre que le dashboard soit chargé
    await page.waitForSelector('h1:has-text("Tableau de bord")', { timeout: 5000 });
  });

  test('devrait afficher toutes les cartes avec opacité visible', async ({ page }) => {
    // Attendre que les animations soient terminées (delay de 0.4s + stagger)
    await page.waitForTimeout(2000);

    // Liste des cartes attendues
    const expectedCards = [
      'Liste des objets',
      'Généalogie',
      'Généalogie Visx',
      'Mon profil',
    ];

    // Vérifier chaque carte
    for (const cardName of expectedCards) {
      const card = page.locator(`text=${cardName}`).first();
      
      // Vérifier que la carte existe
      await expect(card).toBeVisible({ timeout: 5000 });
      
      // Vérifier l'opacité calculée (doit être > 0)
      const opacity = await card.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        return parseFloat(computedStyle.opacity);
      });
      
      expect(opacity).toBeGreaterThan(0);
      
      // Vérifier aussi le parent motion.div
      const parentCard = card.locator('..').locator('..').locator('..');
      const parentOpacity = await parentCard.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        return parseFloat(computedStyle.opacity);
      });
      
      expect(parentOpacity).toBeGreaterThan(0);
    }
  });

  test('devrait vérifier l\'opacité de toutes les cartes visuellement', async ({ page }) => {
    // Attendre que les animations soient terminées
    await page.waitForTimeout(2000);

    // Trouver toutes les cartes dans la grille
    const cards = page.locator('[role="navigation"]').locator('a[href]');
    const count = await cards.count();

    expect(count).toBeGreaterThan(0);

    // Vérifier l'opacité de chaque carte
    const invisibleCards: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const isVisible = await card.isVisible();
      
      if (isVisible) {
        // Vérifier l'opacité calculée
        const opacity = await card.evaluate((el) => {
          const computedStyle = window.getComputedStyle(el);
          return parseFloat(computedStyle.opacity);
        });
        
        // Vérifier aussi le parent motion.div
        const parent = card.locator('..').locator('..');
        const parentOpacity = await parent.evaluate((el) => {
          const computedStyle = window.getComputedStyle(el);
          return parseFloat(computedStyle.opacity);
        });
        
        const cardText = await card.textContent();
        
        if (opacity === 0 || parentOpacity === 0) {
          invisibleCards.push(`${cardText?.trim() || `Carte ${i}`} (opacité: ${opacity}, parent: ${parentOpacity})`);
        }
      }
    }

    // Prendre un screenshot pour diagnostic
    await page.screenshot({ path: 'test-results/dashboard-cards-opacity.png', fullPage: true });

    // Afficher les cartes invisibles dans le rapport
    if (invisibleCards.length > 0) {
      console.error('Cartes avec opacité 0:', invisibleCards);
      expect(invisibleCards.length).toBe(0);
    }
  });

  test('devrait vérifier que les animations FadeInStagger fonctionnent', async ({ page }) => {
    // Attendre que le composant soit monté
    await page.waitForSelector('[role="navigation"]', { timeout: 5000 });
    
    // Vérifier que le parent FadeInStagger existe
    const staggerContainer = page.locator('[role="navigation"]').locator('div').first();
    await expect(staggerContainer).toBeVisible();
    
    // Attendre que les animations soient terminées
    await page.waitForTimeout(2000);
    
    // Vérifier qu'au moins une carte est visible
    const firstCard = page.locator('text=Liste des objets').first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });
    
    // Vérifier l'opacité après animation
    const opacity = await firstCard.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return parseFloat(computedStyle.opacity);
    });
    
    expect(opacity).toBeGreaterThan(0.9); // Devrait être presque 1 après animation
  });
});


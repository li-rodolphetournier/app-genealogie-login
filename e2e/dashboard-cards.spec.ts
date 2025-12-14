/**
 * Tests E2E pour vérifier l'affichage des cartes du dashboard
 * Diagnostic du problème d'opacité
 */

import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Dashboard - Affichage des cartes', () => {
  test.beforeEach(async ({ page }) => {
    // Utiliser le helper de connexion
    await login(page);
  });

  test('devrait afficher toutes les cartes avec opacité visible', async ({ page }) => {
    // Attendre que les animations soient terminées (delay de 0.4s + stagger)
    await page.waitForTimeout(3000);

    // Liste des cartes attendues - utiliser des sélecteurs plus flexibles
    const expectedCards = [
      { text: 'Liste des objets', selector: 'h2:has-text("Liste des objets")' },
      { text: 'Généalogie', selector: 'h2:has-text("Généalogie")' },
      { text: 'Mon profil', selector: 'h2:has-text("Mon profil")' },
    ];

    // Vérifier chaque carte
    for (const card of expectedCards) {
      // Chercher le titre de la carte
      const cardTitle = page.locator(card.selector).first();
      
      // Vérifier que la carte existe
      await expect(cardTitle).toBeVisible({ timeout: 10000 });
      
      // Trouver le conteneur parent de la carte (lien ou div)
      const cardContainer = cardTitle.locator('..').locator('..').locator('..');
      
      // Vérifier l'opacité calculée (doit être > 0)
      const opacity = await cardContainer.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        return parseFloat(computedStyle.opacity);
      });
      
      expect(opacity).toBeGreaterThan(0);
    }
  });

  test('devrait vérifier l\'opacité de toutes les cartes visuellement', async ({ page }) => {
    // Attendre que les animations soient terminées
    await page.waitForTimeout(3000);

    // Trouver toutes les cartes via leurs titres h2
    const cardTitles = page.locator('h2.text-xl.font-medium');
    const count = await cardTitles.count();

    expect(count).toBeGreaterThan(0);

    // Vérifier l'opacité de chaque carte
    const invisibleCards: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const cardTitle = cardTitles.nth(i);
      const isVisible = await cardTitle.isVisible();
      
      if (isVisible) {
        // Trouver le conteneur parent
        const cardContainer = cardTitle.locator('..').locator('..').locator('..');
        
        // Vérifier l'opacité calculée
        const opacity = await cardContainer.evaluate((el) => {
          const computedStyle = window.getComputedStyle(el);
          return parseFloat(computedStyle.opacity);
        });
        
        const cardText = await cardTitle.textContent();
        
        if (opacity === 0) {
          invisibleCards.push(`${cardText?.trim() || `Carte ${i}`} (opacité: ${opacity})`);
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
    await page.waitForLoadState('networkidle');
    
    // Attendre que les animations soient terminées
    await page.waitForTimeout(3000);
    
    // Vérifier qu'au moins une carte est visible via son titre
    const firstCardTitle = page.locator('h2:has-text("Liste des objets")').first();
    await expect(firstCardTitle).toBeVisible({ timeout: 10000 });
    
    // Trouver le conteneur parent
    const cardContainer = firstCardTitle.locator('..').locator('..').locator('..');
    
    // Vérifier l'opacité après animation
    const opacity = await cardContainer.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return parseFloat(computedStyle.opacity);
    });
    
    expect(opacity).toBeGreaterThan(0.9); // Devrait être presque 1 après animation
  });
});


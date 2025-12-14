import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher le switch de thème', async ({ page }) => {
    // Chercher le bouton de thème
    const themeButton = page.getByRole('button', { 
      name: /passer en mode/i 
    });
    
    await expect(themeButton).toBeVisible();
  });

  test('devrait changer de thème au clic', async ({ page }) => {
    // Vérifier le thème initial (peut être light ou dark selon localStorage)
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    // Cliquer sur le switch
    const themeButton = page.getByRole('button', { 
      name: /passer en mode/i 
    });
    await themeButton.click();

    // Attendre que la transition soit terminée
    await page.waitForTimeout(500);

    // Vérifier que le thème a changé
    const newTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    expect(newTheme).not.toBe(initialTheme);
  });

  test('devrait persister le thème dans localStorage', async ({ page }) => {
    // Cliquer sur le switch pour changer le thème
    const themeButton = page.getByRole('button', { 
      name: /passer en mode/i 
    });
    await themeButton.click();
    await page.waitForTimeout(500);

    // Récupérer le thème depuis localStorage
    const savedTheme = await page.evaluate(() => {
      return localStorage.getItem('theme');
    });

    expect(savedTheme).toBeTruthy();
    expect(['light', 'dark']).toContain(savedTheme);
  });

  test('devrait cacher le switch après un délai', async ({ page }) => {
    const themeButton = page.getByRole('button', { 
      name: /passer en mode/i 
    });
    
    // Le switch devrait être visible initialement
    await expect(themeButton).toBeVisible();

    // Attendre le délai de cache (3 secondes)
    await page.waitForTimeout(3500);

    // Le switch devrait être caché
    await expect(themeButton).not.toBeVisible();
  });

  test('devrait afficher la tab quand le switch est caché', async ({ page }) => {
    const themeButton = page.getByRole('button', { 
      name: /passer en mode/i 
    });
    
    // Attendre que le switch soit caché
    await page.waitForTimeout(3500);
    await expect(themeButton).not.toBeVisible();

    // La tab devrait être visible à gauche
    const tab = page.locator('.fixed.left-0.top-0');
    await expect(tab).toBeVisible();
  });

  test('devrait réafficher le switch au clic sur la tab', async ({ page }) => {
    const themeButton = page.getByRole('button', { 
      name: /passer en mode/i 
    });
    
    // Attendre que le switch soit caché
    await page.waitForTimeout(3500);
    await expect(themeButton).not.toBeVisible();

    // Cliquer sur la tab
    const tab = page.locator('.fixed.left-0.top-0');
    await tab.click();

    // Le switch devrait être visible à nouveau
    await expect(themeButton).toBeVisible();
  });

  test('devrait réafficher le switch au survol de la tab', async ({ page }) => {
    const themeButton = page.getByRole('button', { 
      name: /passer en mode/i 
    });
    
    // Attendre que le switch soit caché
    await page.waitForTimeout(3500);
    await expect(themeButton).not.toBeVisible();

    // Survoler la tab
    const tab = page.locator('.fixed.left-0.top-0');
    await tab.hover();

    // Le switch devrait être visible à nouveau
    await expect(themeButton).toBeVisible();
  });

  test('devrait avoir une animation de transition lors du changement de thème', async ({ page }) => {
    // Cliquer sur le switch
    const themeButton = page.getByRole('button', { 
      name: /passer en mode/i 
    });
    
    // Capturer l'état avant le clic
    const beforeClick = await page.screenshot();
    
    await themeButton.click();
    
    // Attendre un peu pour voir l'animation
    await page.waitForTimeout(100);
    
    // Vérifier qu'un overlay de transition existe
    const overlay = page.locator('.fixed.inset-0.z-\\[9999\\]');
    await expect(overlay).toBeVisible({ timeout: 1000 });
    
    // Attendre la fin de l'animation
    await page.waitForTimeout(500);
    
    // L'overlay devrait disparaître
    await expect(overlay).not.toBeVisible({ timeout: 1000 });
  });

  test('devrait fonctionner sur différentes pages', async ({ page }) => {
    // Tester sur la page d'accueil
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const themeButton1 = page.getByRole('button', { 
      name: /passer en mode/i 
    });
    await expect(themeButton1).toBeVisible();

    // Tester sur une autre page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const themeButton2 = page.getByRole('button', { 
      name: /passer en mode/i 
    });
    await expect(themeButton2).toBeVisible();
  });
});


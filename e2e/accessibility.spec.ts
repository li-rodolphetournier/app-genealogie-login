import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { path: '/', name: 'Page de connexion' },
  { path: '/accueil', name: 'Page d\'accueil' },
  { path: '/users', name: 'Liste utilisateurs' },
  { path: '/objects', name: 'Liste objets' },
  { path: '/messages', name: 'Messages' },
  { path: '/genealogie', name: 'Généalogie' },
  { path: '/admin', name: 'Administration' },
  { path: '/create-user', name: 'Création utilisateur' },
  { path: '/forgot-password', name: 'Mot de passe oublié' },
];

const MODES = ['light', 'dark'] as const;
const DEVICES = [
  { name: 'desktop', viewport: { width: 1920, height: 1080 } },
  { name: 'mobile', viewport: { width: 375, height: 667 } },
] as const;

// Tests d'accessibilité avec axe-core
for (const page of PAGES) {
  for (const mode of MODES) {
    for (const device of DEVICES) {
      test(`Accessibilité: ${page.name} - ${mode} - ${device.name}`, async ({ page: testPage }) => {
        await testPage.setViewportSize(device.viewport);
        
        // Naviguer vers la page avec le thème
        const url = `${page.path}${page.path.includes('?') ? '&' : '?'}theme=${mode}`;
        await testPage.goto(url);
        
        // Attendre que la page soit chargée
        await testPage.waitForLoadState('networkidle');
        
        // Exécuter l'audit axe-core
        const accessibilityScanResults = await new AxeBuilder({ page: testPage })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
          .analyze();

        // Vérifier qu'il n'y a pas d'erreurs critiques
        expect(accessibilityScanResults.violations).toEqual([]);
        
        // Log des violations si présentes (pour debug)
        if (accessibilityScanResults.violations.length > 0) {
          console.log(`\n⚠️ Violations détectées sur ${page.name} (${mode}, ${device.name}):`);
          for (const violation of accessibilityScanResults.violations) {
            console.log(`  - ${violation.id}: ${violation.description}`);
            console.log(`    Impact: ${violation.impact}`);
            console.log(`    Nombre d'éléments: ${violation.nodes.length}`);
          }
        }
      });
    }
  }
}

// Tests spécifiques pour la navigation clavier
test.describe('Navigation clavier', () => {
  test('Tous les éléments interactifs sont accessibles au clavier', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Trouver tous les éléments interactifs
    const interactiveElements = await page.$$eval(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      elements => elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim() || '',
        hasTabIndex: el.hasAttribute('tabindex'),
      }))
    );

    // Vérifier qu'il y a des éléments interactifs
    expect(interactiveElements.length).toBeGreaterThan(0);

    // Tester la navigation avec Tab
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('Focus visible sur les éléments interactifs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Trouver le premier bouton
    const button = page.locator('button').first();
    await button.focus();

    // Vérifier que le focus est visible (outline ou border)
    const focusStyles = await button.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        border: styles.border,
      };
    });

    const hasFocusIndicator = 
      focusStyles.outline !== 'none' && focusStyles.outlineWidth !== '0px' ||
      focusStyles.border !== 'none';

    expect(hasFocusIndicator).toBeTruthy();
  });
});

// Tests pour les formulaires
test.describe('Accessibilité des formulaires', () => {
  test('Tous les champs ont des labels associés', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const inputs = await page.$$eval('input, textarea, select', elements =>
      elements.map(el => ({
        id: el.id,
        name: el.getAttribute('name'),
        hasLabel: !!(
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          document.querySelector(`label[for="${el.id}"]`) ||
          el.closest('label')
        ),
      }))
    );

    for (const input of inputs) {
      expect(input.hasLabel).toBeTruthy();
    }
  });

  test('Messages d\'erreur accessibles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Soumettre le formulaire vide pour déclencher des erreurs
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(500);

      // Vérifier que les messages d'erreur ont role="alert"
      const errorMessages = await page.$$eval('[role="alert"]', elements =>
        elements.map(el => ({
          text: el.textContent?.trim(),
          visible: el.offsetParent !== null,
        }))
      );

      // Si des erreurs sont affichées, elles doivent être accessibles
      if (errorMessages.length > 0) {
        for (const error of errorMessages) {
          expect(error.visible).toBeTruthy();
        }
      }
    }
  });
});

// Tests pour les images
test.describe('Accessibilité des images', () => {
  test('Toutes les images ont un attribut alt', async ({ page }) => {
    await page.goto('/accueil');
    await page.waitForLoadState('networkidle');

    const images = await page.$$eval('img', elements =>
      elements.map(img => ({
        src: img.src,
        alt: img.getAttribute('alt'),
        hasAlt: img.hasAttribute('alt'),
      }))
    );

    for (const image of images) {
      // Les images doivent avoir un attribut alt (même vide pour décoratives)
      expect(image.hasAlt).toBeTruthy();
    }
  });
});

// Tests pour le contraste (mode light et dark)
test.describe('Contraste des couleurs', () => {
  for (const mode of MODES) {
    test(`Contraste suffisant en mode ${mode}`, async ({ page }) => {
      const url = `/?theme=${mode}`;
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Utiliser axe-core pour vérifier le contraste
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .withRules(['color-contrast'])
        .analyze();

      // Filtrer uniquement les violations de contraste
      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'color-contrast'
      );

      expect(contrastViolations).toEqual([]);
    });
  }
});


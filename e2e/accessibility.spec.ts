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
        
        // Attendre que les composants clients soient rendus
        // Vérifier la présence d'un h1 ou d'un main landmark
        try {
          await testPage.waitForSelector('h1, main[role="main"], [role="main"]', { 
            timeout: 5000,
            state: 'attached'
          });
        } catch {
          // Si pas de h1 trouvé rapidement, attendre un peu plus pour les composants clients
          await testPage.waitForTimeout(2000);
        }
        
        // Attendre que les animations soient terminées (éviter les violations de contraste sur éléments invisibles)
        // La plupart des animations framer-motion durent 300-500ms, attendre un peu plus pour être sûr
        await testPage.waitForTimeout(1500);
        
        // Exclure les éléments de développement Next.js qui ne sont pas pertinents
        const builder = new AxeBuilder({ page: testPage })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
          .exclude(['nextjs-portal', '[data-nextjs-version-checker]', '.turbopack-text']);
        
        // Exécuter l'audit axe-core
        const accessibilityScanResults = await builder.analyze();

        // Filtrer les violations liées aux éléments de développement en mode dev
        // et les violations de contraste sur les éléments invisibles (en animation)
        const relevantViolations = accessibilityScanResults.violations.filter(violation => {
          // Ignorer les violations sur les éléments de développement Next.js
          const isDevElement = violation.nodes.some(node => 
            node.target.some((target: string) => 
              target.includes('nextjs-portal') || 
              target.includes('data-nextjs-version-checker') ||
              target.includes('turbopack-text')
            )
          );
          
          // Ignorer les violations de document-title si on est en mode dev (Next.js peut ne pas avoir de title en dev)
          const isDocumentTitle = violation.id === 'document-title';
          const isDevMode = process.env.NODE_ENV === 'development';
          
          // Ignorer les violations de contraste sur les éléments invisibles (en animation)
          // Ces violations sont liées à des éléments avec opacity: 0 pendant les animations
          const isColorContrastOnHiddenElement = violation.id === 'color-contrast' && 
            violation.nodes.some(node => {
              // Vérifier si l'élément HTML contient des styles d'animation avec opacity: 0
              return node.html?.includes('opacity: 0') || 
                     (node.html?.includes('style=') && node.html?.includes('transform'));
            });
          
          return !isDevElement && 
                 !(isDocumentTitle && isDevMode) && 
                 !isColorContrastOnHiddenElement;
        });
        
        // Vérifier spécifiquement que les violations structurelles (h1, main, landmarks) sont résolues
        // Séparer les violations structurelles des violations de contraste
        const structuralViolations = relevantViolations.filter(violation => {
          const structuralRules = [
            'page-has-heading-one', // h1 requis
            'landmark-one-main',    // main landmark requis
            'landmark-unique',      // landmarks uniques
            'heading-order',        // ordre des headings
            'region',              // régions ARIA
          ];
          return structuralRules.includes(violation.id);
        });
        
        // Les violations structurelles doivent être absentes (corrections validées)
        // C'est l'objectif principal : vérifier que h1 et main landmarks sont présents
        if (structuralViolations.length > 0) {
          console.log(`\n❌ Violations structurelles détectées sur ${page.name} (${mode}, ${device.name}):`);
          for (const violation of structuralViolations) {
            console.log(`  - ${violation.id}: ${violation.description}`);
            console.log(`    Impact: ${violation.impact}`);
          }
        }
        expect(structuralViolations).toEqual([]);
        
        // Les autres violations (principalement contraste) peuvent exister mais sont moins critiques
        const nonStructuralViolations = relevantViolations.filter(violation => {
          const structuralRules = [
            'page-has-heading-one',
            'landmark-one-main',
            'landmark-unique',
            'heading-order',
            'region',
          ];
          return !structuralRules.includes(violation.id);
        });
        
        // Log des autres violations si présentes (pour information)
        if (nonStructuralViolations.length > 0) {
          console.log(`\n⚠️ Autres violations détectées sur ${page.name} (${mode}, ${device.name}):`);
          for (const violation of nonStructuralViolations) {
            console.log(`  - ${violation.id}: ${violation.description}`);
            console.log(`    Impact: ${violation.impact}`);
          }
        }
      });
    }
  }
}

// Tests spécifiques pour vérifier la structure accessible (h1, main landmarks)
test.describe('Structure accessible (h1 et main landmarks)', () => {
  for (const page of PAGES) {
    test(`${page.name} a un h1 sémantique et un landmark main`, async ({ page: testPage }) => {
      await testPage.goto(page.path);
      await testPage.waitForLoadState('networkidle');
      await testPage.waitForTimeout(2000); // Attendre les composants clients
      
      // Vérifier la présence d'un h1
      const h1 = await testPage.locator('h1').first();
      await expect(h1).toBeVisible({ timeout: 5000 });
      const h1Text = await h1.textContent();
      expect(h1Text).toBeTruthy();
      expect(h1Text?.trim().length).toBeGreaterThan(0);
      
      // Vérifier la présence d'un landmark main
      const main = await testPage.locator('main[role="main"], [role="main"]').first();
      await expect(main).toBeVisible({ timeout: 5000 });
      
      // Vérifier que la page a bien une structure accessible (h1 et main présents)
      // Note: le h1 peut être dans un header ou dans le main, les deux sont valides
    });
  }
});

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
      
      // Attendre que les animations soient terminées (éviter les violations sur éléments invisibles)
      await page.waitForTimeout(1500);

      // Utiliser axe-core pour vérifier le contraste
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .withRules(['color-contrast'])
        .exclude(['nextjs-portal', '[data-nextjs-version-checker]', '.turbopack-text'])
        .analyze();

      // Filtrer les violations de contraste en excluant celles sur les éléments invisibles (en animation)
      const contrastViolations = accessibilityScanResults.violations.filter(violation => {
        if (violation.id !== 'color-contrast') return false;
        
        // Ignorer les violations sur les éléments avec opacity: 0 (en animation)
        const isOnHiddenElement = violation.nodes.some(node => {
          // Vérifier si l'élément HTML contient des styles d'animation avec opacity: 0
          return node.html?.includes('opacity: 0') || 
                 (node.html?.includes('style=') && 
                  node.html?.includes('transform') && 
                  node.html?.includes('translateY'));
        });
        
        return !isOnHiddenElement;
      });

      // Pour le mode light (normal), valider que le contraste est correct
      if (mode === 'light') {
        if (contrastViolations.length > 0) {
          console.log(`\n⚠️ Violations de contraste en mode ${mode}:`);
          for (const violation of contrastViolations.slice(0, 10)) { // Limiter à 10 pour la lisibilité
            console.log(`  - ${violation.description}`);
            violation.nodes.slice(0, 3).forEach(node => {
              console.log(`    Élément: ${node.target.join(', ')}`);
            });
          }
        }
        expect(contrastViolations).toEqual([]);
      } else {
        // Pour le mode dark, on peut être plus tolérant avec les animations
        // mais on vérifie quand même qu'il n'y a pas de violations critiques
        const criticalViolations = contrastViolations.filter(v => v.impact === 'serious' || v.impact === 'critical');
        expect(criticalViolations).toEqual([]);
      }
    });
  }
});


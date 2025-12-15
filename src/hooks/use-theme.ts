'use client';

import { useEffect, useRef, useState } from 'react';

export type Theme = 'light' | 'dark';
export type ThemeTemplate = 'default' | 'ocean-sunset' | 'warm-gradient' | 'modern';

const TEMPLATE_CSS_MAP: Record<ThemeTemplate, string> = {
  default: '/styles/themes/template-default.css',
  'ocean-sunset': '/styles/themes/template-ocean-sunset.css',
  'warm-gradient': '/styles/themes/template-warm-gradient.css',
  modern: '/styles/themes/template-modern.css',
};

function loadTemplateCSS(template: ThemeTemplate): void {
  // Retirer tous les anciens liens CSS de template
  const existingLinks = document.querySelectorAll('link[data-theme-template]');
  existingLinks.forEach((link) => link.remove());

  // Vérifier si le CSS est déjà chargé (via le script inline dans layout.tsx)
  const existingLink = document.querySelector(`link[href="${TEMPLATE_CSS_MAP[template]}"]`);
  if (existingLink) {
    // Le CSS est déjà chargé par le script inline, juste mettre à jour l'attribut
    existingLink.setAttribute('data-theme-template', template);
    document.documentElement.setAttribute('data-theme-template', template);
    return;
  }

  // Créer et ajouter le nouveau lien CSS (chargement asynchrone pour ne pas bloquer)
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = TEMPLATE_CSS_MAP[template];
  link.setAttribute('data-theme-template', template);
  // Ne pas attendre le chargement du CSS, oncharge est optionnel
  document.head.appendChild(link);

  // Exposer le template courant sur html pour debug/styles ciblés
  document.documentElement.setAttribute('data-theme-template', template);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');
  const [template, setTemplateState] = useState<ThemeTemplate>('default');
  const [mounted, setMounted] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const hasLoadedServerTemplateRef = useRef(false);

  useEffect(() => {
    // Définir mounted immédiatement pour permettre le rendu du composant
    // Le CSS est déjà chargé par le script inline dans layout.tsx
    setMounted(true);

    // Récupérer le thème depuis localStorage ou la préférence système
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const localGlobalTemplate = localStorage.getItem('themeTemplateGlobal') as
      | ThemeTemplate
      | null;
    const savedTemplate = localStorage.getItem('themeTemplate') as ThemeTemplate | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    const initialTemplate = localGlobalTemplate || savedTemplate || 'default';

    setThemeState(initialTheme);
    setTemplateState(initialTemplate);
    
    // Appliquer le thème au document immédiatement
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Charger le CSS du template de manière asynchrone (ne bloque pas le rendu)
    // Le CSS est normalement déjà chargé par le script inline, mais on s'assure qu'il est bien appliqué
    setTimeout(() => {
      loadTemplateCSS(initialTemplate);
    }, 0);

    // Préparer le canal de broadcast entre onglets
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channelRef.current = new BroadcastChannel('theme-template');
      channelRef.current.onmessage = (event) => {
        const nextTemplate = event.data?.template as ThemeTemplate | undefined;
        const nextTheme = event.data?.theme as Theme | undefined;

        if (nextTemplate) {
          setTemplateState(nextTemplate);
          localStorage.setItem('themeTemplate', nextTemplate);
          loadTemplateCSS(nextTemplate);
        }

        if (nextTheme) {
          setThemeState(nextTheme);
          localStorage.setItem('theme', nextTheme);
          if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      };
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'themeTemplateGlobal' && event.newValue) {
        const nextTemplate = event.newValue as ThemeTemplate;
        setTemplateState(nextTemplate);
        localStorage.setItem('themeTemplate', nextTemplate);
        loadTemplateCSS(nextTemplate);
      }

      if (event.key === 'theme' && event.newValue) {
        const nextTheme = event.newValue as Theme;
        setThemeState(nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    // Charger éventuellement le template global défini côté serveur
    // (n'écrase pas les préférences locales existantes)
    const loadServerTemplate = async () => {
      try {
        if (hasLoadedServerTemplateRef.current) return;
        hasLoadedServerTemplateRef.current = true;

        const response = await fetch('/api/theme/default-template', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { template?: string };
        const serverTemplate = (data.template || 'default') as ThemeTemplate;

        const currentGlobal = localStorage.getItem('themeTemplateGlobal') as
          | ThemeTemplate
          | null;
        const currentLocal = localStorage.getItem('themeTemplate') as ThemeTemplate | null;

        // N'appliquer que si aucun choix explicite n'existe encore
        if (!currentGlobal && !currentLocal) {
          setTemplateState(serverTemplate);
          localStorage.setItem('themeTemplate', serverTemplate);
          localStorage.setItem('themeTemplateGlobal', serverTemplate);
          loadTemplateCSS(serverTemplate);
        }
      } catch (error) {
        // Silencieux en cas d'erreur réseau / API
        // On reste sur le template local ou par défaut
        // eslint-disable-next-line no-console
        console.debug('[useTheme] Impossible de charger le template global', error);
      }
    };

    // Lancer le chargement du template global après le premier rendu
    setTimeout(() => {
      void loadServerTemplate();
    }, 0);

    return () => {
      window.removeEventListener('storage', handleStorage);
      channelRef.current?.close();
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    channelRef.current?.postMessage({ theme: newTheme });
  };

  const applyTemplate = (newTemplate: ThemeTemplate, options?: { global?: boolean }) => {
    setTemplateState(newTemplate);
    localStorage.setItem('themeTemplate', newTemplate);
    if (options?.global) {
      localStorage.setItem('themeTemplateGlobal', newTemplate);
    }
    loadTemplateCSS(newTemplate);
    channelRef.current?.postMessage({ template: newTemplate });
  };

  const applyGlobalTemplate = (newTemplate: ThemeTemplate) => applyTemplate(newTemplate, { global: true });

  return {
    theme,
    setTheme: setThemeState,
    toggleTheme,
    template,
    setTemplate: applyTemplate,
    applyGlobalTemplate,
    mounted,
  };
}


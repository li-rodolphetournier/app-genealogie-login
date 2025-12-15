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

  // Créer et ajouter le nouveau lien CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = TEMPLATE_CSS_MAP[template];
  link.setAttribute('data-theme-template', template);
  document.head.appendChild(link);

  // Exposer le template courant sur html pour debug/styles ciblés
  document.documentElement.setAttribute('data-theme-template', template);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');
  const [template, setTemplateState] = useState<ThemeTemplate>('default');
  const [mounted, setMounted] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
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

    setMounted(true);
    // Récupérer le thème depuis localStorage ou la préférence système
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const globalTemplate = localStorage.getItem('themeTemplateGlobal') as ThemeTemplate | null;
    const savedTemplate = localStorage.getItem('themeTemplate') as ThemeTemplate | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    const initialTemplate = globalTemplate || savedTemplate || 'default';
    
    setThemeState(initialTheme);
    setTemplateState(initialTemplate);
    
    // Charger le CSS du template
    loadTemplateCSS(initialTemplate);
    
    // Appliquer le thème au document
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

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


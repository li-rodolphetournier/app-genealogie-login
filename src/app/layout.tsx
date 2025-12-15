import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ToastProvider";
import { AnimatePresence } from "framer-motion";
import { AuthDebugPanelWrapper } from "@/lib/features/auth-debug";
import { SessionTimeoutProvider } from "@/components/auth/SessionTimeoutProvider";
import { GlobalHeader } from "@/components/GlobalHeader";
import { ThemeFloatingMenu } from "@/components/theme/ThemeFloatingMenu";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  preload: false, // Désactiver le preload pour éviter les warnings
  display: "swap", // Améliorer les performances
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  preload: false, // Désactiver le preload pour éviter les warnings
  display: "swap", // Améliorer les performances
});

export const metadata: Metadata = {
  title: "Site de Généalogie",
  description: "Application de gestion et de visualisation de généalogie",
  icons: {
    icon: "/favicon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png?v=2" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                const template = localStorage.getItem('themeTemplate') || 'default';
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const shouldBeDark = theme === 'dark' || (!theme && prefersDark);
                if (shouldBeDark) {
                  document.documentElement.classList.add('dark');
                  if (!theme) {
                    localStorage.setItem('theme', 'dark');
                  }
                } else {
                  if (!theme) {
                    localStorage.setItem('theme', 'light');
                  }
                }
                // Charger le CSS du template
                const templateMap = {
                  'default': '/styles/themes/template-default.css',
                  'ocean-sunset': '/styles/themes/template-ocean-sunset.css',
                  'warm-gradient': '/styles/themes/template-warm-gradient.css',
                  'modern': '/styles/themes/template-modern.css'
                };
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = templateMap[template] || templateMap['default'];
                link.setAttribute('data-theme-template', template);
                document.head.appendChild(link);
                document.documentElement.setAttribute('data-theme-template', template);
              })();
            `,
          }}
        />
      </head>
      <body className={`m-0 p-0 ${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <GlobalHeader />
        <ErrorBoundary>
          <ToastProvider>
            <AnimatePresence mode="wait">
              {children}
            </AnimatePresence>
          </ToastProvider>
        </ErrorBoundary>
        {/* Gestion du timeout de session et de l'inactivité */}
        <SessionTimeoutProvider />
        {/* Panneau de debug d'authentification (uniquement en dev ou si activé) */}
        <AuthDebugPanelWrapper />
        {/* Menu flottant de personnalisation du thème */}
        <ThemeFloatingMenu />
        {/* Script pour désenregistrer tout service worker fantôme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

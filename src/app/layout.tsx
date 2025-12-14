import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ToastProvider";
import { AnimatePresence } from "framer-motion";
import { AuthDebugPanelWrapper } from "@/lib/features/auth-debug";
import { SessionTimeoutProvider } from "@/components/auth/SessionTimeoutProvider";
import { GlobalHeader } from "@/components/GlobalHeader";

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
  title: "Stock des objets",
  description: "Une application pour les lister tous et dans les tenebre les lier",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const shouldBeDark = theme === 'dark' || (!theme && prefersDark);
                if (shouldBeDark) {
                  document.documentElement.classList.add('dark');
                }
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

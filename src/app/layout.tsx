import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ToastProvider";
import { AnimatePresence } from "framer-motion";
import { AuthDebugPanelWrapper } from "@/components/debug/AuthDebugPanelWrapper";

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
    <html lang="fr">
      <body className={`m-0 p-0 ${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <ErrorBoundary>
          <ToastProvider>
            <AnimatePresence mode="wait">
              {children}
            </AnimatePresence>
          </ToastProvider>
        </ErrorBoundary>
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

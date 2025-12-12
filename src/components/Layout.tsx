import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BackToHomeButton } from './navigation';

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 relative">
      {!isLoginPage && (
        <BackToHomeButton className="fixed top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 z-10 border-transparent" label="Accueil" />
      )}
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-md">
        {children}
      </div>
    </div>
  );
}

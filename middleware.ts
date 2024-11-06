import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Ajouter un timeout de 30 secondes
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), 30000);
  });

  return Promise.race([
    timeoutPromise,
    NextResponse.next(),
  ]);
}

export const config = {
  matcher: '/api/:path*',
}; 
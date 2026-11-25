import { NextRequest, NextResponse } from 'next/server';

/**
 * Recover app preview URLs accidentally containing Markdown asterisks.
 * Preserve the canonical URL without third-party tracking query strings.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let decoded = pathname;
  try { decoded = decodeURIComponent(pathname); } catch { /* Keep raw pathname. */ }

  if (/^\/app\*+\/?$/.test(decoded)) {
    const destination = request.nextUrl.clone();
    destination.pathname = '/app';
    destination.search = '';
    return NextResponse.redirect(destination, 308);
  }

  return NextResponse.next();
}

export const config = { matcher: ['/app*'] };

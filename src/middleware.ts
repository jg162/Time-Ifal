import { NextRequest, NextResponse } from 'next/server';

/**
 * Proteção de rotas no edge: verifica a PRESENÇA do cookie de sessão
 * e aplica o redirecionamento de páginas. A validação criptográfica
 * completa (assinatura JWT + usuário no banco) é feita em cada rota
 * de API, que nunca confia apenas nesse cookie.
 */
const COOKIE_NAME = 'volley_performance_token';

// Páginas acessíveis sem sessão
const PUBLIC_PAGES = ['/login', '/cadastro', '/recuperar-senha'];

// Cartão público: /cartao/[slug] é aberto por links compartilhados
const PUBLIC_PREFIXES = ['/cartao/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);

  // APIs fazem a própria validação (JWT assinado + usuário no banco)
  if (pathname.startsWith('/api/')) return NextResponse.next();

  const isPublicPage = PUBLIC_PAGES.includes(pathname);
  const isPublicPrefix = PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
  const isAsset = pathname.startsWith('/_next') || pathname === '/favicon.ico';

  if (isAsset || isPublicPrefix) return NextResponse.next();

  if (!hasSession && !isPublicPage && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Usuário logado não precisa ver login/cadastro/capa
  if (hasSession && (isPublicPage || pathname === '/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // roda em páginas e navegações; deixa estáticos fora
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

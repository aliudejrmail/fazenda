import type { CookieOptions, Response } from 'express';
import { parseTtlMs } from './ttl';

export const ACCESS_COOKIE = 'fz_access';
export const REFRESH_COOKIE = 'fz_refresh';
export const CSRF_HEADER = 'x-requested-with';
export const CSRF_VALUE = 'fazenda-web';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function baseOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSiteEnv = (process.env.COOKIE_SAMESITE ?? '').toLowerCase();
  const sameSite: CookieOptions['sameSite'] =
    sameSiteEnv === 'none' || sameSiteEnv === 'strict' || sameSiteEnv === 'lax'
      ? sameSiteEnv
      : 'lax';

  return {
    httpOnly: true,
    // SameSite=None exige Secure
    secure: isProd || sameSite === 'none',
    sameSite,
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  ttl: { access?: string; refresh?: string },
) {
  const base = baseOptions();
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    path: '/',
    maxAge: parseTtlMs(ttl.access) ?? 15 * 60_000,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    // refresh só trafega nas rotas de auth
    path: '/api/v1/auth',
    maxAge: parseTtlMs(ttl.refresh) ?? 7 * 86_400_000,
  });
}

export function clearAuthCookies(res: Response) {
  const base = baseOptions();
  res.clearCookie(ACCESS_COOKIE, { ...base, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: '/api/v1/auth' });
}

/**
 * Proteção CSRF para autenticação por cookie: mutações que chegam com cookie
 * de sessão (e sem Authorization Bearer) precisam do header customizado, o que
 * força preflight CORS e impede formulários cross-site.
 */
export function csrfMiddleware(
  req: {
    method: string;
    headers: Record<string, string | string[] | undefined>;
    cookies?: Record<string, string>;
  },
  res: {
    status: (code: number) => { json: (body: unknown) => void };
  },
  next: () => void,
) {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return next();

  const hasBearer = String(req.headers.authorization ?? '')
    .toLowerCase()
    .startsWith('bearer ');
  const hasSessionCookie = Boolean(
    req.cookies?.[ACCESS_COOKIE] || req.cookies?.[REFRESH_COOKIE],
  );

  if (!hasBearer && hasSessionCookie) {
    const header = String(req.headers[CSRF_HEADER] ?? '');
    if (header !== CSRF_VALUE) {
      return res
        .status(403)
        .json({ statusCode: 403, message: 'Requisição bloqueada (CSRF)' });
    }
  }
  next();
}

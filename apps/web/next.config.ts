import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/** Destino do proxy /api/* (server-side). Em produção, URL interna/pública da API. */
const apiTarget = (process.env.API_PROXY_TARGET ?? "http://localhost:3001").replace(/\/$/, "");

/** Origem extra permitida no connect-src caso NEXT_PUBLIC_API_URL aponte para outro domínio. */
function externalApiOrigin(): string | null {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url || url.startsWith("/")) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function contentSecurityPolicy(): string {
  const connect = ["'self'", externalApiOrigin()].filter(Boolean).join(" ");
  return [
    "default-src 'self'",
    // Next injeta scripts inline (hidratação); eval só em dev (HMR/refresh)
    `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connect}${isProd ? "" : " ws: wss:"}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiTarget}/api/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

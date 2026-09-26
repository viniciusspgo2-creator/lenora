import type { NextConfig } from "next";

// ───────────────────────── Security & performance headers ─────────────────────────
// Applied to every route via `source: '/(.*)'`. The CSP + HSTS entries are
// production-only — they break the Next.js dev overlay (eval, inline styles
// injected by HMR) so we skip them when NODE_ENV !== 'production'. The
// remaining headers are safe in dev too.
const BASE_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const PROD_ONLY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    // Loose enough to not break the storefront / admin / charts. Allows
    // self + https: for everything (Stripe-like 3rd-party safe), data: for
    // inline data URIs, 'unsafe-inline' for styles (next-themes injects CSS
    // vars), 'unsafe-eval' for charts/sandbox. Images allow blob: for
    // client-side previews. Fonts get data: for the next/font self-host.
    value:
      "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data: blob:; font-src 'self' https: data:; connect-src 'self' https: data:;",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const headers = [...BASE_SECURITY_HEADERS];
    if (isProd) headers.push(...PROD_ONLY_HEADERS);
    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
};

export default nextConfig;

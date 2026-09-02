import type { AuthConfig } from "convex/server";

export default {
  providers: [
    // Standard Convex Auth provider for this project's own sign-in ("Get
    // Started" email/guest, see src/convex/auth.ts). The deployment
    // self-issues JWTs (iss = CONVEX_SITE_URL, no `kid` header) validated
    // via OIDC discovery at `${domain}/.well-known/openid-configuration`,
    // served by auth.addHttpRoutes() in convex/http.ts. Do NOT convert this
    // entry to `type: "customJwt"` — that path rejects tokens without a
    // `kid` header, so sign-in would silently never confirm and RequireAuth
    // would loop back to /auth forever.
    {
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
    // Freebuff platform federated tokens. The issuer and JWKS URL are
    // hardcoded to avoid requiring a VLY_CONVEX_AUTH_ISSUER env var on
    // the production deployment (which the deploy key cannot set).
    {
      type: "customJwt",
      issuer: "https://freebuff.com",
      jwks: "https://freebuff.com/api/web/.well-known/jwks.json",
      applicationID: "vly-convex",
      algorithm: "RS256",
    },
  ],
} satisfies AuthConfig;

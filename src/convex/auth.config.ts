import type { AuthConfig } from "convex/server";

// Freebuff-signed federated tokens (see freebuff web's
// src/lib/vly-convex-jwt.ts) let a signed-in freebuff.com user carry their
// identity into this project without going through local sign-in. customJwt
// is correct for this provider: freebuff's tokens and JWKS both carry a
// `kid` header, which the customJwt validation path requires.
//
// This provider is only included when VLY_CONVEX_AUTH_ISSUER is set.
// When the env var is missing the provider is silently omitted, which
// avoids a Convex deployment error while still allowing the project's
// own email-otp and anonymous providers to work normally.
const freebuffIssuer = process.env.VLY_CONVEX_AUTH_ISSUER;

const providers: AuthConfig["providers"] = [
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
];

// Only add the Freebuff federated provider when the issuer is configured.
if (freebuffIssuer) {
  providers.push({
    type: "customJwt",
    issuer: freebuffIssuer,
    jwks: `${freebuffIssuer}/api/web/.well-known/jwks.json`,
    applicationID: "vly-convex",
    algorithm: "RS256",
  });
}

export default {
  providers,
} satisfies AuthConfig;

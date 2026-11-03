import { createRemoteJWKSet, jwtVerify } from "jose";

type NeonAuthConfig = {
  jwksUrl: string;
  issuer: string;
  audience?: string;
};

export function createNeonTokenVerifier(config: NeonAuthConfig) {
  const jwksUrl = new URL(config.jwksUrl);
  if (jwksUrl.protocol !== "https:" && jwksUrl.hostname !== "localhost" && jwksUrl.hostname !== "127.0.0.1") {
    throw new Error("Neon JWKS must use HTTPS.");
  }
  const jwks = createRemoteJWKSet(jwksUrl);

  return async (token: string) => {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: config.issuer,
      audience: config.audience || undefined,
      requiredClaims: ["sub", "exp"],
    });
    if (!payload.sub) throw new Error("Token subject is missing.");
    if (payload.role !== "authenticated") throw new Error("An authenticated user is required.");
    return {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
    };
  };
}

let verifier: ReturnType<typeof createNeonTokenVerifier> | undefined;

export function getNeonTokenVerifier() {
  if (verifier) return verifier;
  const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
  const issuer = process.env.NEON_AUTH_ISSUER;
  if (!jwksUrl || !issuer) {
    throw new Error("NEON_AUTH_JWKS_URL and NEON_AUTH_ISSUER are required.");
  }
  verifier = createNeonTokenVerifier({
    jwksUrl,
    issuer,
    audience: process.env.NEON_AUTH_AUDIENCE,
  });
  return verifier;
}

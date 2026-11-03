function authUrl() {
  const value = process.env.NEON_AUTH_BASE_URL;
  if (!value) throw new Error("NEON_AUTH_BASE_URL is required.");
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("Neon Auth must use HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash) throw new Error("Invalid Neon Auth URL.");
  return url.toString().replace(/\/$/, "");
}

type AnonymousClient = {
  getAnonymousToken(): Promise<{ data?: { token: string } | null; error?: unknown }>;
};
let anonymousClient: Promise<AnonymousClient> | undefined;

export async function getNeonAnonymousToken() {
  anonymousClient ??= import("@neon/neon-js/auth").then(({ createAuthClient }) =>
    createAuthClient(authUrl()) as unknown as AnonymousClient,
  );
  const client = await anonymousClient;
  const result = await client.getAnonymousToken();
  if (result.error || !result.data?.token) throw new Error("Could not get an anonymous access token.");
  return result.data.token;
}

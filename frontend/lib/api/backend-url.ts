const defaultBackendUrl = "http://localhost:4000";

export function getBackendUrl() {
  return process.env.NEXT_PUBLIC_EXPRESS_API_URL ?? defaultBackendUrl;
}

export function errorStatus(error: unknown, fallback = 500): number {
  if (!error || typeof error !== "object") return fallback;
  const value = error as { code?: unknown; message?: unknown };
  if (value.code === "42501") return 403;
  if (value.code === "PGRST116" || value.code === "P0002") return 404;
  if (typeof value.message === "string") {
    const message = value.message.toLowerCase();
    if (message === "unauthorized" || message.includes("permission denied") || message.includes("don't have permission") || message.includes("access denied") ||
        message === "note not found or cannot be edited.") return 403;
    if (message.includes("not found")) return 404;
  }
  return fallback;
}

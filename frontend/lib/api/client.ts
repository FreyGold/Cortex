import { getBackendUrl } from "@/lib/api/backend-url";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiRequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  headers?: HeadersInit;
};

type ErrorPayload = {
  error?: string;
  message?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(`${getBackendUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store", // Prevent aggressive Next.js caching
  });

  const payload = (await response.json().catch(() => null)) as
    | TResponse
    | ErrorPayload
    | null;

  if (!response.ok) {
    const errorPayload = payload as ErrorPayload | null;
    const message =
      errorPayload?.error ??
      errorPayload?.message ??
      `API request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as TResponse;
}

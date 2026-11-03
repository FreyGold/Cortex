import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/neon/server";

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/auth/logout", request.url));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  const headers = new Headers(request.headers);
  headers.set("content-type", "application/json");
  const signOutRequest = new Request(new URL("/api/auth/sign-out", request.url), {
    method: "POST",
    headers,
    body: "{}",
  });
  const signOutResponse = await auth.handler().POST(signOutRequest, {
    params: Promise.resolve({ path: ["sign-out"] }),
  });
  if (!signOutResponse.ok) {
    return NextResponse.json({ error: "Could not sign out. Please try again." }, { status: 502 });
  }

  const response = NextResponse.redirect(new URL("/auth/login", request.url), 303);
  for (const cookie of signOutResponse.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

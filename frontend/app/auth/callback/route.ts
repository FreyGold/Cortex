import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/data";
  return NextResponse.redirect(new URL(target, request.url));
}

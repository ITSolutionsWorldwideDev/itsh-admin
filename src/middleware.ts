// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isStaticFile = /\.[^/]+$/.test(pathname);

  // ✅ Skip middleware for static assets & API routes
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon-96x96.png") ||
    isStaticFile
  ) {
    return NextResponse.next();
  }

  const isAuthRoute = pathname.startsWith("/auth");
  const token = req.cookies.get("token")?.value;

  if (!token && !isAuthRoute) {
    const signInUrl = new URL("/auth/sign-in", req.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon-96x96.png).*)"],
};

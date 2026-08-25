import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Debe coincidir con AUTH_SESSION_COOKIE en lib/auth-session.ts */
const AUTH_SESSION_COOKIE = "argos_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/noc")) {
    if (request.cookies.get(AUTH_SESSION_COOKIE)?.value !== "1") {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  if (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  if (pathname === "/mascot-motion-lab" || pathname.startsWith("/mascot-motion-lab/")) {
    const labEnabled =
      process.env.NODE_ENV === "development" ||
      process.env.ALLOW_MASCOT_MOTION_LAB === "1";
    if (!labEnabled) {
      return new NextResponse(null, { status: 404 });
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/noc",
    "/noc/:path*",
    "/auth/login",
    "/auth/register",
    "/mascot-motion-lab",
    "/mascot-motion-lab/:path*"
  ]
};

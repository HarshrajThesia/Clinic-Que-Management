import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const roleRoutes: Record<string, string> = {
  "/admin": "admin",
  "/receptionist": "receptionist",
  "/doctor": "doctor",
  "/patient": "patient",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("cms_token")?.value;
  const userCookie = request.cookies.get("cms_user")?.value;

  if (pathname === "/login" || pathname === "/") return NextResponse.next();

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      const matchedPrefix = Object.keys(roleRoutes).find((prefix) =>
        pathname.startsWith(prefix)
      );
      if (matchedPrefix && roleRoutes[matchedPrefix] !== user.role) {
        return NextResponse.redirect(new URL(`/${user.role}`, request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/receptionist/:path*", "/doctor/:path*", "/patient/:path*"],
};

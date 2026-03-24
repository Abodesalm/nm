import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const SECTION_PATHS: Record<string, string> = {
  employees: "/employees",
  storage: "/storage",
  history: "/history",
  points: "/points",
  customers: "/customers",
  problems: "/problems",
  finance: "/finance",
  documents: "/documents",
  settings: "/settings",
};

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Not logged in → redirect to login
  if (!token) {
    if (pathname.startsWith("/login")) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logged in + trying to access login → redirect to dashboard
  if (pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Check session validity — call internal API (runs on Node.js runtime, not Edge)
  if (!token.isSuperAdmin && token.sessionId) {
    try {
      const checkRes = await fetch(
        new URL(
          `/api/auth/check-session?sessionId=${token.sessionId}&userId=${token.id}`,
          req.url,
        ),
        { headers: { cookie: req.headers.get("cookie") ?? "" } },
      );
      const data = await checkRes.json();

      if (!data.valid) {
        const res = NextResponse.redirect(
          new URL("/login?reason=forced", req.url),
        );
        res.cookies.delete("next-auth.session-token");
        res.cookies.delete("__Secure-next-auth.session-token");
        return res;
      }
    } catch (e) {
      // Don't block user if check fails
    }
  }

  // Super admin → full access
  if (token.isSuperAdmin) return NextResponse.next();

  // Check section permissions
  for (const [section, path] of Object.entries(SECTION_PATHS)) {
    if (pathname.startsWith(path)) {
      const permissions = token.permissions as any[];
      const perm = permissions?.find((p) => p.section === section);
      if (!perm || perm.permission === "none") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

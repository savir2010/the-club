import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional password for the hosted demo. Set SITE_PASSWORD (and optionally SITE_USER, default
 * "club") on the host and the browser asks for them once. Unset locally, so nothing changes here.
 */
export function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();
  const user = process.env.SITE_USER || "club";
  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Basic ")) {
    try {
      const [u, ...rest] = atob(auth.slice(6)).split(":");
      if (u === user && rest.join(":") === password) return NextResponse.next();
    } catch {}
  }
  return new NextResponse("This demo is private.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="The Club demo", charset="UTF-8"' },
  });
}

export const config = {
  // Node.js, not Edge: Vercel services don't support Edge functions
  runtime: "nodejs",
  // everything except Next's own static files and the favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

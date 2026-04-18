import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const rawSecret = process.env.NEXTAUTH_SECRET;
if (!rawSecret) throw new Error("NEXTAUTH_SECRET ortam değişkeni tanımlı değil");
const SECRET = new TextEncoder().encode(rawSecret);

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Dev bypass: getSession() ile tutarlı olması için aynı koşul
  if (process.env.NODE_ENV === "development" && process.env.DEV_USER_ID) {
    return NextResponse.next();
  }

  const token = req.cookies.get("mirros_session")?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      
      // /admin Koruması
      if (pathname.startsWith("/admin") && !payload.isAdmin) {
        const homeUrl = req.nextUrl.clone();
        homeUrl.pathname = "/";
        return NextResponse.redirect(homeUrl);
      }

      return NextResponse.next();
    } catch {
      // token geçersiz
    }
  }

  // API isteklerini 401 ile reddet (client-side'da handle edilebilsin)
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Giriş yapman gerekiyor" }, { status: 401 });
  }

  // Sayfa isteklerini /login'e yönlendir
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET env değişkeni tanımlı değil");
}
const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function createSession(userId: string, username: string, isAdmin: boolean = false) {
  const token = await new SignJWT({ userId, username, isAdmin })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);

  const jar = await cookies();
  jar.set("mirros_session", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   60 * 60 * 24 * 30,
    path:     "/",
  });
}

export async function getSession(): Promise<{ id: string; username: string; isAdmin?: boolean } | null> {
  // Dev bypass — sadece local development, staging veya production'da KULLANMA
  if (process.env.NODE_ENV === "development" && process.env.DEV_USER_ID) {
    return { id: process.env.DEV_USER_ID, username: "dev", isAdmin: false };
  }

  try {
    const jar   = await cookies();
    const token = jar.get("mirros_session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return { 
      id: payload.userId as string, 
      username: payload.username as string,
      isAdmin: payload.isAdmin as boolean 
    };
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    if (typeof window === "undefined") {
      // In Server Components or API routes, throw an error that can be caught
      // or handled naturally by Next.js if it were a server action.
      // For now, throwing a clear error string for API try/catch blogs.
      throw new Error("UNAUTHORIZED");
    }
    redirect("/login");
  }
  return session;
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete("mirros_session");
}

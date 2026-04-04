import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "changeme-in-production"
);

export async function createSession(userId: string, username: string) {
  const token = await new SignJWT({ userId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);

  const jar = await cookies();
  jar.set("mirros_session", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 30,
    path:     "/",
  });
}

export async function getSession(): Promise<{ id: string; email: string } | null> {
  // Dev bypass
  if (process.env.NODE_ENV !== "production" && process.env.DEV_USER_ID) {
    return { id: process.env.DEV_USER_ID, email: "dev@mirros.app" };
  }

  try {
    const jar   = await cookies();
    const token = jar.get("mirros_session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return { id: payload.userId as string, email: payload.username as string };
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete("mirros_session");
}

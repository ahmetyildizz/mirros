import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireAuth();
  const full = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, username: true, email: true, provider: true, avatarUrl: true, streak: true, longestStreak: true, lastPlayedAt: true },
  });
  return NextResponse.json(full ?? {
    id: user.id,
    username: user.username,
    streak: 0,
    longestStreak: 0,
    lastPlayedAt: null,
  });
}

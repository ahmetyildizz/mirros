import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";

export async function GET() {
  const user = await requireAuth();
  return NextResponse.json({ id: user.id, username: user.username });
}

import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "test-user-1";
  const username = searchParams.get("username") || "TestUser";
  
  await createSession(userId, username, false);
  
  return NextResponse.json({ success: true, userId, username });
}

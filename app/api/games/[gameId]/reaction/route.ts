import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer } from "@/lib/pusher/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { id: userId } = await requireAuth();
    const { gameId } = await params;
    const { emoji, username } = await req.json();

    if (!emoji) {
      return NextResponse.json({ error: "Emoji gerekli" }, { status: 400 });
    }

    // Reaction eventini tüm oyuna duyur
    await pusherServer.trigger(`game-${gameId}`, "reaction-received", {
      userId,
      username: username || "Anonim",
      emoji,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

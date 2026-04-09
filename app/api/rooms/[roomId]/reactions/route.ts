import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer } from "@/lib/pusher/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const user = await requireAuth();
  const { roomId } = await params;
  const { emoji }  = await req.json();

  if (!emoji) return NextResponse.json({ error: "Emoji gerekli" }, { status: 400 });

  await pusherServer.trigger(`room-${roomId}`, "reaction-received", {
    userId:   user.id,
    username: user.username || "Anonim",
    emoji:    emoji,
  });

  return NextResponse.json({ success: true });
}

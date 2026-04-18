import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer } from "@/lib/pusher/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await requireAuth();

    const { emoji } = await req.json();
    if (!emoji) return new NextResponse("Missing emoji", { status: 400 });

    const { roomId } = await params;

    await pusherServer.trigger(`room-${roomId}`, "reaction-received", {
      userId:   user.id,
      username: user.username || "Anonim",
      emoji:    emoji,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[REACTION_ERROR]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

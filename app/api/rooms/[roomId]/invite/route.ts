import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer } from "@/lib/pusher/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await requireAuth();
    const { roomId } = await params;
    const { receiverId } = await req.json();

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { host: true }
    });

    if (!room) return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
    if (room.hostId !== user.id) return NextResponse.json({ error: "Sadece oda sahibi davet edebilir" }, { status: 403 });

    // Arkadaş mı kontrol et
    const friendship = await db.friendship.findFirst({
      where: {
        OR: [
          { requesterId: user.id, receiverId: receiverId, status: "ACCEPTED" },
          { requesterId: receiverId, receiverId: user.id, status: "ACCEPTED" }
        ]
      }
    });

    if (!friendship) return NextResponse.json({ error: "Sadece arkadaşlarınızı davet edebilirsiniz" }, { status: 403 });

    const invite = await db.roomInvite.create({
      data: {
        roomId,
        senderId: user.id,
        receiverId,
        status: "PENDING"
      }
    });

    // Real-time davet gönder
    await pusherServer.trigger(`private-user-${receiverId}`, "room-invite", {
      id: invite.id,
      roomCode: room.code,
      senderName: user.username,
      category: room.category
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}

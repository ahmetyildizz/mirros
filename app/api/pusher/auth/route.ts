import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const formData = await req.formData();
    const socketId = formData.get("socket_id") as string;
    const channel  = formData.get("channel_name") as string;

    if (!socketId || !channel) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Kanal bazlı yetkilendirme kontrolü
    if (channel.startsWith("private-user-")) {
      // Sadece kendi private kanalına abone olabilir
      const channelUserId = channel.replace("private-user-", "");
      if (channelUserId !== user.id) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else if (channel.startsWith("private-room-")) {
      // Sadece katıldığı odanın kanalına abone olabilir
      const roomId = channel.replace("private-room-", "");
      const participant = await db.roomParticipant.findUnique({
        where: { roomId_userId: { roomId, userId: user.id } },
        select: { userId: true },
      });
      if (!participant) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else if (channel.startsWith("presence-")) {
      // Presence kanalları için oda üyeliği kontrolü
      const roomId = channel.replace("presence-", "");
      const participant = await db.roomParticipant.findUnique({
        where: { roomId_userId: { roomId, userId: user.id } },
        select: { userId: true },
      });
      if (!participant) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
    // "room-{id}" gibi public kanallar için ek kontrol yapılmaz (Pusher public channels)

    const authResponse = pusherServer.authorizeChannel(socketId, channel, {
      user_id: user.id,
      user_info: {
        id: user.id,
        name: user.username
      },
    });

    return NextResponse.json(authResponse);
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { pusherServer } from "@/lib/pusher/server";

const bodySchema = z.object({ code: z.string().min(4).max(8) });

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Geçersiz kod" }, { status: 400 });

  const room = await db.room.findUnique({ where: { code: body.data.code.toUpperCase() } });
  if (!room) return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
  if (room.status !== "WAITING") return NextResponse.json({ error: "Oda dolu" }, { status: 409 });
  if (room.hostId === user.id && process.env.NODE_ENV === "production")
    return NextResponse.json({ error: "Kendi odana katılamazsın" }, { status: 400 });

  const updated = await db.room.update({
    where: { id: room.id },
    data:  { guestId: user.id, status: "ACTIVE" },
  });

  await pusherServer.trigger(`room-${room.id}`, "player-joined", {
    guestId: user.id,
    roomId:  room.id,
  });

  return NextResponse.json({ id: updated.id, code: updated.code });
}

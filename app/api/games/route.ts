import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { startGame } from "@/lib/services/game.service";

const bodySchema = z.object({ roomId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  const body = bodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "roomId gerekli" }, { status: 400 });

  const room = await db.room.findUnique({ where: { id: body.data.roomId } });
  if (!room) return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
  if (room.hostId !== user.id) return NextResponse.json({ error: "Sadece host başlatabilir" }, { status: 403 });

  try {
    const result = await startGame(body.data.roomId);
    return NextResponse.json(result, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { moderateContent } from "@/lib/logic/moderation";

const questionSchema = z.object({
  text:      z.string().min(3).max(500),
  category:  z.string().min(2).max(50),
  options:   z.array(z.string()).min(2).max(6).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const user = await requireAuth();
  const { roomId } = await params;
  const body = questionSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Geçersiz soru verisi" }, { status: 400 });

  // Moderation Check
  const textMod = moderateContent(body.data.text);
  if (!textMod.isClean) return NextResponse.json({ error: textMod.reason }, { status: 400 });
  
  const catMod = moderateContent(body.data.category);
  if (!catMod.isClean) return NextResponse.json({ error: catMod.reason }, { status: 400 });

  if (body.data.options) {
    for (const opt of body.data.options) {
      const optMod = moderateContent(opt);
      if (!optMod.isClean) return NextResponse.json({ error: `Şık uygunsuz: ${optMod.reason}` }, { status: 400 });
    }
  }

  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room) return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
  if (room.hostId !== user.id) return NextResponse.json({ error: "Sadece host soru ekleyebilir" }, { status: 403 });

  const customQuestion = await db.question.create({
    data: {
      roomId,
      text:     body.data.text,
      category: body.data.category,
      options:  (body.data.options as any) ?? null,
      gameMode: room.gameMode,
    },
  });

  return NextResponse.json(customQuestion);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  await requireAuth();
  const { roomId } = await params;

  const questions = await db.question.findMany({
    where:   { roomId },
    orderBy: { id: "desc" },
  });

  return NextResponse.json(questions);
}

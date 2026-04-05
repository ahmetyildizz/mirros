import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

function generateCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const bodySchema = z.object({
  gameMode:   z.enum(["SOCIAL", "QUIZ"]).default("SOCIAL"),
  ageGroup:   z.enum(["CHILD", "ADULT", "WISE"]).optional(),
  maxPlayers: z.number().int().min(2).max(10).default(4),
});

// ageGroup artık room'a değil katılımcıya kaydedilir

export async function POST(req: NextRequest) {
  const user = await requireAuth();

  const json = await req.json().catch(() => ({}));
  const body = bodySchema.parse(json);

  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
    if (attempts > 10) return NextResponse.json({ error: "Kod üretilemedi" }, { status: 500 });
  } while (await db.room.findUnique({ where: { code } }));

  const room = await db.room.create({
    data: {
      code,
      hostId:     user.id,
      status:     "WAITING",
      gameMode:   body.gameMode,
      maxPlayers: body.maxPlayers,
      participants: { create: { userId: user.id, ageGroup: body.ageGroup } },
    },
  });

  return NextResponse.json({ id: room.id, code: room.code, gameMode: room.gameMode, maxPlayers: room.maxPlayers }, { status: 201 });
}

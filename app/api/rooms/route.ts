import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";

function generateCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const bodySchema = z.object({
  gameMode:   z.enum(["SOCIAL", "QUIZ"]).default("SOCIAL"),
  ageGroup:   z.enum(["CHILD", "ADULT", "WISE"]).optional(),
  maxPlayers: z.number().int().min(2).max(12).default(4),
  category:   z.string().optional(),
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
      category:   body.category,
      participants: { create: { userId: user.id, ageGroup: body.ageGroup } },
    },
  });

  await createAuditLog({
    action: "CREATE",
    entityType: "ROOM",
    entityId: room.id,
    resource: `Room ${room.code}`,
    userId: user.id,
    details: { gameMode: body.gameMode, maxPlayers: body.maxPlayers, category: body.category },
  });

  return NextResponse.json({ 
    id: room.id, 
    code: room.code, 
    gameMode: room.gameMode, 
    maxPlayers: room.maxPlayers,
    category: room.category 
  }, { status: 201 });
}

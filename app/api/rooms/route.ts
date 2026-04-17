import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";

import { refillGlobalPool } from "@/lib/services/ai.service";

function generateCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const bodySchema = z.object({
  gameMode:   z.enum(["SOCIAL", "QUIZ", "EXPOSE"]),
  maxPlayers: z.number().min(2).max(20),
  ageGroup:   z.enum(["CHILD", "ADULT", "WISE"]).optional(),
  category:   z.string().optional(),
});

const PROFANITY_FILTER = ["sik", "yarrak", "am", "göt", "fuck", "shit"]; // Örnek küfür filtresi

function isOffensive(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return PROFANITY_FILTER.some(word => lower.includes(word));
}

// ageGroup artık room'a değil katılımcıya kaydedilir

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const json = await req.json().catch(() => ({}));
    const body = bodySchema.parse(json);

    if (body.category && isOffensive(body.category)) {
      return NextResponse.json({ error: "Geçersiz kategori adı" }, { status: 400 });
    }

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

    // Global havuzu arka planda doldur (oyuncular lobide beklerken sorular hazır olsun)
    if (body.category) {
      refillGlobalPool(body.gameMode, body.category, 10)
        .catch(err => console.error("[AI] Room creation pool refill failed:", err));
    }

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
  } catch (error: any) {
    console.error("Room creation error:", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Oda oluşturulamadı" }, { status: 500 });
  }
}

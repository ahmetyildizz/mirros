import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rateLimit";

import { refillGlobalPool } from "@/lib/services/ai.service";

function generateCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const bodySchema = z.object({
  gameMode:    z.enum(["SOCIAL", "QUIZ", "EXPOSE", "BLUFF", "SPY"]),
  maxPlayers:  z.number().min(2).max(20),
  totalRounds: z.number().min(1).max(20).optional(),
  ageGroup:    z.enum(["CHILD", "ADULT", "WISE"]).optional(),
  category:    z.string().optional(),
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

    // Rate limit: kullanıcı başına 5 oda/dakika
    const rl = await rateLimit(`rooms:${user.id}`, { max: 5, windowMs: 60_000 });
    if (!rl.allowed) return NextResponse.json({ error: "Çok fazla oda oluşturuyorsun" }, { status: 429 });

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

    // Kapasite kontrolü (Limitlere yaklaşıldıysa mail atar)
    const { checkCapacityAndAlert } = await import("@/lib/monitoring/capacity");
    checkCapacityAndAlert().catch(e => console.error("Capacity check failed:", e));

    return NextResponse.json({ 
      id: room.id, 
      code: room.code, 
      gameMode: room.gameMode, 
      maxPlayers: room.maxPlayers,
      category: room.category 
    }, { status: 201 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz istek parametreleri" }, { status: 400 });
    }
    console.error("Room creation error:", error);
    return NextResponse.json({ error: "Oda oluşturulamadı" }, { status: 500 });
  }
}

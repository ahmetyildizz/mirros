import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";

import { generateQuestionsWithAI } from "@/lib/services/ai.service";

function generateCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const bodySchema = z.object({
  gameMode:   z.enum(["SOCIAL", "QUIZ", "EXPOSE"]).default("SOCIAL"),
  ageGroup:   z.enum(["CHILD", "ADULT", "WISE"]).optional(),
  maxPlayers: z.number().int().min(2).max(12).default(4),
  category:   z.string().optional(),
});

// ageGroup artık room'a değil katılımcıya kaydedilir

export async function POST(req: NextRequest) {
  try {
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

    // AI Soru Üretimi (Arka planda başlat ama odayı hemen dön)
    if (body.category) {
      generateQuestionsWithAI(body.category, 10).then(async (aiQuestions) => {
        if (aiQuestions && aiQuestions.length > 0) {
          await db.question.createMany({
            data: aiQuestions.map((q: any) => ({
              roomId:   room.id,
              text:     q.text,
              options:  q.options || null,
              difficulty: q.difficulty || "EASY",
              category: body.category!,
              gameMode: body.gameMode,
            }))
          });
        }
      }).catch(err => console.error("AI Generation Failed in background:", err));
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

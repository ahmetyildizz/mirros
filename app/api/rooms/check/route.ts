import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Kod gerekli" }, { status: 400 });
  }

  try {
    const room = await db.room.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        category: true,
        gameMode: true,
        status: true
      }
    });

    if (!room) {
      return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({
      id:       room.id,
      category: room.category,
      gameMode: room.gameMode,
      status:   room.status,
      isCoupleNight: room.category === "Çift Gecesi"
    });
  } catch (error) {
    return NextResponse.json({ error: "İşlem sırasında hata oluştu" }, { status: 500 });
  }
}

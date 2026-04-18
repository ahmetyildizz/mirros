export const dynamic    = "force-dynamic";
export const maxDuration = 300; // Vercel Pro: 5 dakika

import { NextRequest, NextResponse } from "next/server";
import { refillGlobalPool } from "@/lib/services/ai.service";
import { db } from "@/lib/db";

const DAILY_CATEGORIES = [
  "Günlük Hayat",
  "Teknoloji ve Sosyal Medya",
  "Aşk ve İlişkiler",
  "Kariyer ve Hırs",
  "Yemek ve Lezzet",
  "Korku ve Kaygı",
  "Hayaller ve Hedefler",
  "Gece Alışkanlıkları",
  "Kişilik ve Karakter",
  "Eğlence ve Mizah",
];

/**
 * POST /api/admin/refill-daily
 * Günlük soru havuzunu AI ile büyütür.
 * Her çağrıda ~300 yeni SOCIAL soru ekler.
 *
 * Header: x-seed-secret: <SEED_SECRET>
 * Body (optional): { "count": 30 }  — kategori başına soru sayısı (max 50)
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const perCategory = Math.min(Number(body.count) || 30, 50);

  const beforeCount = await db.question.count({
    where: { gameMode: "SOCIAL", isActive: true, roomId: null },
  });

  const results: { category: string; added: number }[] = [];
  let totalAdded = 0;

  for (const category of DAILY_CATEGORIES) {
    try {
      const added = await refillGlobalPool("SOCIAL", category, perCategory);
      results.push({ category, added });
      totalAdded += added;
      console.log(`[refill-daily] ${category}: +${added}`);
    } catch (e) {
      console.error(`[refill-daily] ${category} hatası:`, e);
      results.push({ category, added: 0 });
    }
  }

  const afterCount = await db.question.count({
    where: { gameMode: "SOCIAL", isActive: true, roomId: null },
  });

  return NextResponse.json({
    ok:          true,
    totalAdded,
    poolBefore:  beforeCount,
    poolAfter:   afterCount,
    perCategory,
    results,
  });
}

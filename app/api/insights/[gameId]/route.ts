import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

function generateInsight(
  familiarity: number,
  exactCount: number,
  closeCount: number,
  wrongCount: number,
  totalRounds: number
): string {
  const exactRate = exactCount / totalRounds;
  const wrongRate = wrongCount / totalRounds;

  if (familiarity >= 90)
    return "İkiniz neredeyse aynı zihin yapısına sahipsiniz. Birbirini bu kadar iyi tanıyan iki insan bulmak gerçekten nadir!";

  if (familiarity >= 70) {
    if (exactRate >= 0.4)
      return "Birbirinizi gerçekten iyi tanıyorsunuz. Tam eşleşmeleriniz bunu açıkça gösteriyor.";
    return "Birbirinizi oldukça iyi tanıyorsunuz — ufak nüansları kaçırsanız da özü yakalıyorsunuz.";
  }

  if (familiarity >= 50) {
    if (closeCount >= exactCount)
      return "Birbirinizi tahmin edebiliyorsunuz ama detaylarda zaman zaman ayrılıyorsunuz.";
    return "Temel konularda uyumlusunuz, bazı alanlarda ise henüz birbirinizi keşfediyorsunuz.";
  }

  if (familiarity >= 30) {
    if (wrongRate >= 0.6)
      return "Birbirinizi daha iyi tanımak için harika bir fırsatınız var! Bu oyun sadece başlangıç.";
    return "Bazı konularda sürprizler yaşadınız — bu aslında en güzel keşifler.";
  }

  return "Birbirinizi tanımak için yeni bir maceraya başlıyorsunuz. Bir sonraki oyun çok daha yakın geçecek!";
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  await requireAuth();
  const { gameId } = await params;

  const game = await db.game.findUnique({
    where:   { id: gameId },
    include: { scores: true },
  });
  if (!game) return NextResponse.json({ error: "Oyun bulunamadı" }, { status: 404 });

  const exactCount  = game.scores.filter((s: { matchLevel: string }) => s.matchLevel === "EXACT").length;
  const closeCount  = game.scores.filter((s: { matchLevel: string }) => s.matchLevel === "CLOSE").length;
  const wrongCount  = game.scores.filter((s: { matchLevel: string }) => s.matchLevel === "WRONG").length;
  const totalPoints = game.scores.reduce((acc: number, sc: { points: number }) => acc + sc.points, 0);
  const familiarity = Math.round((totalPoints / (game.totalRounds * 10)) * 100);

  const text = generateInsight(familiarity, exactCount, closeCount, wrongCount, game.totalRounds);

  // Daha önce oluşturulduysa tekrar oluşturma
  const existing = await db.insight.findFirst({ where: { gameId } });
  if (existing) return NextResponse.json({ text: existing.text, familiarity });

  const room = await db.room.findUnique({ where: { id: game.roomId } });
  if (!room) return NextResponse.json({ error: "Oda bulunamadı" }, { status: 404 });

  const insight = await db.insight.create({
    data: {
      gameId,
      userAId:    room.hostId,
      userBId:    room.guestId!,
      text,
      patternKey: `f${familiarity}`,
    },
  });

  return NextResponse.json({ text: insight.text, familiarity });
}

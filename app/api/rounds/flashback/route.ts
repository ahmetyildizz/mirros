import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    
    const { searchParams } = new URL(req.url);
    const userId     = searchParams.get("userId");
    const questionId = searchParams.get("questionId");
    const currentRoundId = searchParams.get("currentRoundId");

    if (!userId || !questionId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Bu kullanıcının bu soruya verdiği GEÇMİŞ cevapları bul (mevcut round hariç)
    const pastAnswers = await db.answer.findMany({
      where: {
        userId,
        round: {
          questionId,
          id: { not: currentRoundId ?? "" },
        },
      },
      include: {
        round: {
          include: {
            game: {
              select: { finishedAt: true }
            }
          }
        }
      },
      orderBy: { submittedAt: "desc" },
      take: 3,
    });

    return NextResponse.json({ pastAnswers });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

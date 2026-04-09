export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { id: userId } = await requireAuth();
    
    // 1. Bugünün tarihini belirle (00:00:00)
    const today = startOfDay(new Date());

    // 2. Bugünün sorusunu bul
    let daily = await db.dailyQuestion.findFirst({
      where: {
        date: {
          gte: today,
          lte: endOfDay(today),
        },
      },
      include: {
        question: {
          select: {
            id: true,
            text: true,
            options: true,
            category: true,
          },
        },
        answers: {
          select: {
            userId: true,
            content: true,
          },
        },
      },
    });

    // 3. Eğer bugün için soru seçilmemişse, havuzdan rastgele bir tane seç
    if (!daily) {
      const allQuestionIds = await db.question.findMany({
        where: { gameMode: "SOCIAL", isActive: true },
        select: { id: true },
      });

      if (allQuestionIds.length === 0) {
        return NextResponse.json({ error: "No questions available" }, { status: 404 });
      }

      const randomId = allQuestionIds[Math.floor(Math.random() * allQuestionIds.length)].id;

      daily = await db.dailyQuestion.create({
        data: {
          date: today,
          questionId: randomId,
        },
        include: {
          question: {
            select: {
              id: true,
              text: true,
              options: true,
              category: true,
            },
          },
          answers: {
            select: {
              userId: true,
              content: true,
            },
          },
        },
      });
    }

    // 4. Kullanıcının cevabını kontrol et
    const userAnswer = daily.answers.find((a) => a.userId === userId);

    // 5. İstatistikleri hesapla
    const stats: Record<string, number> = {};
    const options = (daily.question.options as string[]) || [];
    
    options.forEach(opt => stats[opt] = 0);
    daily.answers.forEach(ans => {
      if (stats[ans.content] !== undefined) stats[ans.content]++;
    });

    const total = daily.answers.length;
    const percentages = Object.keys(stats).reduce((acc, opt) => {
      acc[opt] = total > 0 ? Math.round((stats[opt] / total) * 100) : 0;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      id: daily.id,
      question: daily.question,
      answered: !!userAnswer,
      userAnswer: userAnswer?.content,
      totalParticipants: total,
      percentages,
      counts: stats,
      participants: daily.answers.slice(0, 10).map(a => a.userId),
    });
  } catch (error) {
    console.error("Daily question error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id: userId } = await requireAuth();
    const { dailyQuestionId, content } = await req.json();

    if (!dailyQuestionId || !content) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Cevabı kaydet
    const answer = await db.dailyAnswer.upsert({
      where: {
        dailyQuestionId_userId: {
          dailyQuestionId,
          userId,
        },
      },
      update: { content },
      create: {
        dailyQuestionId,
        userId,
        content,
      },
      include: {
        user: { select: { username: true } }
      }
    });

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

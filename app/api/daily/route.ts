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

    // 3. Eğer bugün için soru seçilmemişse, havuzdan daha önce kullanılmamış bir tane seç
    if (!daily) {
      const usedIds = (await db.dailyQuestion.findMany({ select: { questionId: true } }))
        .map((d) => d.questionId);

      const candidates = await db.question.findMany({
        where: { gameMode: "SOCIAL", isActive: true, id: { notIn: usedIds } },
        select: { id: true },
      });

      // Tüm sorular kullanılmışsa havuzu sıfırla (döngüsel)
      const pool = candidates.length > 0
        ? candidates
        : await db.question.findMany({ where: { gameMode: "SOCIAL", isActive: true }, select: { id: true } });

      if (pool.length === 0) {
        return NextResponse.json({ error: "No questions available" }, { status: 404 });
      }

      const randomId = pool[Math.floor(Math.random() * pool.length)].id;

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

    // 6. Soruyu global kullanım için formatla ([İSİM] -> Siz)
    const formatGlobalQuestion = (text: string) => {
      let formatted = text.replace(/\[İSİM\]/gi, "Siz");
      
      // Bazı temel dilbilgisi düzeltmeleri (Opsiyonel ama şık durur)
      // Örn: "Siz ... sahipti?" -> "Siz ... sahiptiniz?"
      formatted = formatted
        .replace(/miydi\?/g, "miydiniz?")
        .replace(/mıydı\?/g, "mıydınız?")
        .replace(/muydu\?/g, "muydunuz?")
        .replace(/müydü\?/g, "müydünüz?")
        .replace(/rdi\?/g, "rdiniz?")
        .replace(/rdı\?/g, "rdınız?")
        .replace(/ti\?/g, "tiniz?")
        .replace(/tı\?/g, "tınız?")
        .replace(/tu\?/g, "tunuz?")
        .replace(/tü\?/g, "tünüz?")
        .replace(/di\?/g, "diniz?")
        .replace(/dı\?/g, "dınız?")
        .replace(/du\?/g, "dunuz?")
        .replace(/dü\?/g, "dünüz?");
      
      return formatted;
    };

    const formattedQuestion = {
      ...daily.question,
      text: formatGlobalQuestion(daily.question.text)
    };

    return NextResponse.json({
      id: daily.id,
      question: formattedQuestion,
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
  } catch (error: any) {
    console.error("Daily question POST error:", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}

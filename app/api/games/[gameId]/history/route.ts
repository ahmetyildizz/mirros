import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    await requireAuth();
    const { gameId } = await params;

    const rounds = await db.round.findMany({
      where: {
        gameId,
        status: "SCORED",
      },
      include: {
        question: {
          select: {
            text: true,
            category: true,
          },
        },
        answers: {
          include: {
            user: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        guesses: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        number: "asc",
      },
    });

    // Veriyi daha temiz bir yapıya dönüştürelim
    const history = rounds.map((r) => {
      const answererAnswer = r.answers.find((a) => a.userId === r.answererId);
      return {
        number: r.number,
        question: r.question.text,
        category: r.question.category,
        answererId: r.answererId,
        answer: answererAnswer?.content || "Cevaplanmadı",
        answererName: answererAnswer?.user.username || "Anonim",
        answererAvatar: answererAnswer?.user.avatarUrl,
        guesses: r.guesses.map(g => ({
          username: g.user.username,
          guess: g.content,
          matchLevel: (g as any).matchLevel, // prisma schema handles this
        })),
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

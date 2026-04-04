import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

const querySchema = z.object({
  category:   z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  exclude:    z.string().optional(), // comma-separated question IDs
});

export async function GET(req: NextRequest) {
  await requireAuth();

  const { searchParams } = req.nextUrl;
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz parametre" }, { status: 400 });

  const { category, difficulty, exclude } = parsed.data;
  const excludeIds = exclude ? exclude.split(",") : [];

  const question = await db.question.findFirst({
    where: {
      isActive: true,
      ...(category   && { category }),
      ...(difficulty && { difficulty }),
      ...(excludeIds.length && { id: { notIn: excludeIds } }),
    },
    orderBy: { id: "asc" },
    skip: Math.floor(Math.random() * 10),
  });

  if (!question) return NextResponse.json({ error: "Soru bulunamadı" }, { status: 404 });
  return NextResponse.json(question);
}

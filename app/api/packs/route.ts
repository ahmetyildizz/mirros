import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";

const CreatePackSchema = z.object({
  name:        z.string().min(2).max(80),
  description: z.string().max(200).optional(),
  isPublic:    z.boolean().default(false),
  gameMode:    z.enum(["SOCIAL", "QUIZ", "EXPOSE"]).default("SOCIAL"),
  category:    z.string().min(1).max(60),
  questions:   z.array(z.object({
    text:    z.string().min(5).max(300),
    options: z.array(z.string()).optional(),
    correct: z.string().optional(),
  })).min(3).max(50),
});

// GET /api/packs — public paketleri listele
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";

  const session = await getSession();
  if (mine && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packs = await db.questionPack.findMany({
    where: mine
      ? { creatorId: session!.id }
      : { isPublic: true },
    include: {
      creator:   { select: { username: true, avatarUrl: true } },
      _count:    { select: { questions: true } },
    },
    orderBy: { playCount: "desc" },
    take: 50,
  });

  return NextResponse.json(packs);
}

// POST /api/packs — yeni paket oluştur
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreatePackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, description, isPublic, gameMode, category, questions } = parsed.data;

  // Slug üret: name → kebab-case + kısa random suffix
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const pack = await db.questionPack.create({
    data: {
      slug,
      name,
      description,
      isPublic,
      gameMode,
      category,
      creatorId: session.id,
      questions: {
        create: questions.map(q => ({
          text:    q.text,
          options: q.options ? q.options : undefined,
          correct: q.correct ?? null,
        })),
      },
    },
    include: {
      _count: { select: { questions: true } },
    },
  });

  return NextResponse.json(pack, { status: 201 });
}

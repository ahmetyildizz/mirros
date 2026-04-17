import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { refillGlobalPool } from "@/lib/services/ai.service";

const bodySchema = z.object({
  gameMode:   z.enum(["SOCIAL", "QUIZ", "EXPOSE"]),
  category:   z.string().min(2).max(80),
  count:      z.number().int().min(5).max(30).default(15),
  ageGroup:   z.enum(["CHILD", "ADULT", "WISE"]).optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const body = bodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }

  const { gameMode, category, count } = body.data;

  const saved = await refillGlobalPool(gameMode, category, count);

  return NextResponse.json({ ok: true, saved, gameMode, category });
}

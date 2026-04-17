import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

// GET /api/packs/[slug] — paket detayı + sorular
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const pack = await db.questionPack.findUnique({
    where: { slug },
    include: {
      creator:   { select: { username: true, avatarUrl: true } },
      questions: true,
    },
  });

  if (!pack) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Public değilse sadece sahibi görebilir
  const session = await getSession();
  if (!pack.isPublic && pack.creatorId !== session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(pack);
}

// DELETE /api/packs/[slug] — paketi sil (sadece sahibi)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session  = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pack = await db.questionPack.findUnique({ where: { slug } });
  if (!pack) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (pack.creatorId !== session.id && !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.questionPack.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}

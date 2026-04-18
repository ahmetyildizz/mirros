import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { safeTrigger } from "@/lib/pusher/server";
import { rateLimit } from "@/lib/rateLimit";

// Emoji whitelist: tek bir Unicode emoji (grapheme cluster), max 10 karakter
const bodySchema = z.object({
  emoji:    z.string().min(1).max(10),
  username: z.string().max(30).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { id: userId } = await requireAuth();
    const { gameId } = await params;

    // Rate limit: kullanıcı başına 10 reaction/10sn
    const rl = await rateLimit(`reaction:${userId}`, { max: 10, windowMs: 10_000 });
    if (!rl.allowed) return NextResponse.json({ error: "Çok fazla emoji gönderdin" }, { status: 429 });

    const body = bodySchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Geçersiz içerik" }, { status: 400 });

    await safeTrigger(`game-${gameId}`, "reaction-received", {
      userId,
      username: body.data.username || "Anonim",
      emoji:    body.data.emoji,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

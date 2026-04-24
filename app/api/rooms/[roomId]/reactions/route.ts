import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { safeTrigger } from "@/lib/pusher/server";
import { rateLimit } from "@/lib/rateLimit";

const bodySchema = z.object({
  emoji: z.string().min(1).max(10),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const user = await requireAuth();
  const { roomId } = await params;

  const { allowed } = await rateLimit(`reaction:${user.id}:${roomId}`, { max: 20, windowMs: 10_000 });
  if (!allowed) return NextResponse.json({ error: "Çok hızlı emoji gönderiyorsun" }, { status: 429 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz emoji" }, { status: 400 });

  await safeTrigger(`room-${roomId}`, "reaction-received", {
    userId:   user.id,
    username: user.username || "Anonim",
    emoji:    parsed.data.emoji,
  });

  return NextResponse.json({ success: true });
}

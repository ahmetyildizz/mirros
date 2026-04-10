import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rateLimit";
import { createAuditLog } from "@/lib/audit";

const bodySchema = z.object({
  username: z.string().min(2).max(20).regex(/^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ ]+$/, "Harf, rakam, boşluk ve _ kullanabilirsin"),
});

export async function POST(req: NextRequest) {
  const ip  = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = rateLimit(`login:${ip}`, { max: 10, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "Çok fazla deneme. 1 dakika bekle." }, { status: 429 });
  }

  const body = bodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }

  const { username } = body.data;

  const user = await db.user.upsert({
    where:  { username },
    update: {},
    create: { username, email: `${username}@mirros.app` },
  });

  await createAuditLog({
    action: "LOGIN",
    entityType: "USER",
    entityId: user.id,
    resource: `User ${username} logged in`,
    userId: user.id,
  });

  await createSession(user.id, username);
  return NextResponse.json({ ok: true });
}

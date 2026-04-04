import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";

const bodySchema = z.object({
  username: z.string().min(2).max(20).regex(/^[a-zA-Z0-9_]+$/, "Sadece harf, rakam ve _ kullanabilirsin"),
});

export async function POST(req: NextRequest) {
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

  await createSession(user.id, username);
  return NextResponse.json({ ok: true });
}

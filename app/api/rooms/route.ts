import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST() {
  const user = await requireAuth();

  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
    if (attempts > 10) return NextResponse.json({ error: "Kod üretilemedi" }, { status: 500 });
  } while (await db.room.findUnique({ where: { code } }));

  const room = await db.room.create({
    data: { code, hostId: user.id, status: "WAITING" },
  });

  return NextResponse.json({ id: room.id, code: room.code }, { status: 201 });
}

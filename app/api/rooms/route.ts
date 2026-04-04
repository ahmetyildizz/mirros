import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

function generateCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 0/O/1/I karışıklığı yok
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
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
    data: {
      code,
      hostId: user.id,
      status: "WAITING",
      participants: {
        create: { userId: user.id },
      },
    },
  });

  return NextResponse.json({ id: room.id, code: room.code }, { status: 201 });
}

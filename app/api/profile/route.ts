import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, createSession } from "@/lib/auth/session";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { username } = await req.json();

    if (!username || username.length < 3) {
      return NextResponse.json({ error: "Kullanıcı adı en az 3 karakter olmalıdır" }, { status: 400 });
    }

    if (username.length > 20) {
      return NextResponse.json({ error: "Kullanıcı adı çok uzun" }, { status: 400 });
    }

    // Is username taken?
    const existing = await db.user.findUnique({
      where: { username },
    });

    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "Bu kullanıcı adı zaten alınmış" }, { status: 409 });
    }

    // Update DB
    const updated = await db.user.update({
      where: { id: user.id },
      data: { username },
    });

    // REFRESH SESSION
    // lib/auth/session.ts createSession sets the cookie
    await createSession(updated.id, updated.username!);

    return NextResponse.json({ success: true, username: updated.username });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await requireAuth();

    const requests = await db.friendship.findMany({
      where: {
        receiverId: user.id,
        status: "PENDING"
      },
      include: {
        requester: { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}

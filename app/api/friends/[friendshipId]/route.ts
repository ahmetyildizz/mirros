import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> }
) {
  try {
    const user = await requireAuth();
    const { friendshipId } = await params;
    const { status } = await req.json(); // ACCEPTED or REJECTED (DELETE)

    const friendship = await db.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) return NextResponse.json({ error: "İstek bulunamadı" }, { status: 404 });
    if (friendship.receiverId !== user.id) return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });

    if (status === "ACCEPTED") {
      const updated = await db.friendship.update({
        where: { id: friendshipId },
        data: { status: "ACCEPTED" }
      });
      return NextResponse.json(updated);
    } else {
      await db.friendship.delete({
        where: { id: friendshipId }
      });
      return NextResponse.json({ ok: true });
    }
  } catch (error) {
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> }
) {
  try {
    const user = await requireAuth();
    const { friendshipId } = await params;

    const friendship = await db.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) return NextResponse.json({ error: "Arkadaşlık bulunamadı" }, { status: 404 });
    if (friendship.requesterId !== user.id && friendship.receiverId !== user.id) {
       return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
    }

    await db.friendship.delete({
      where: { id: friendshipId }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}

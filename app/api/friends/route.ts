import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rateLimit";

const postSchema = z.object({
  friendUsername: z.string().min(2).max(20),
});

export async function GET() {
  try {
    const user = await requireAuth();

    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { requesterId: user.id },
          { receiverId: user.id }
        ],
        status: "ACCEPTED"
      },
      include: {
        requester: { select: { id: true, username: true, avatarUrl: true } },
        receiver:  { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    const friends = friendships.map(f => {
      const friend = f.requesterId === user.id ? f.receiver : f.requester;
      return {
        id: friend.id,
        username: friend.username,
        avatarUrl: friend.avatarUrl,
        friendshipId: f.id
      };
    });

    return NextResponse.json(friends);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const { allowed } = await rateLimit(`friend-req:${user.id}`, { max: 10, windowMs: 60_000 });
    if (!allowed) return NextResponse.json({ error: "Çok fazla arkadaşlık isteği gönderdin" }, { status: 429 });

    const parsed = postSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { friendUsername } = parsed.data;

    const friend = await db.user.findFirst({
      where: { username: { equals: friendUsername, mode: "insensitive" } }
    });
    if (!friend) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    if (friend.id === user.id) return NextResponse.json({ error: "Kendini arkadaş ekleyemezsin" }, { status: 400 });

    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { requesterId: user.id, receiverId: friend.id },
          { requesterId: friend.id, receiverId: user.id }
        ]
      }
    });

    if (existing) return NextResponse.json({ error: "Zaten arkadaşsınız veya bekleyen bir istek var" }, { status: 400 });

    const friendship = await db.friendship.create({
      data: {
        requesterId: user.id,
        receiverId: friend.id,
        status: "PENDING"
      }
    });

    return NextResponse.json(friendship);
  } catch {
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

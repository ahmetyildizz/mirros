import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher/server";

export async function POST(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { emoji } = await req.json();
    if (!emoji) return new NextResponse("Missing emoji", { status: 400 });

    const { roomId } = params;

    // Komik ses efektleri için bir harita (isteğe bağlı, frontend tarafında da yönetilebilir)
    // Ama Pusher ile herkese "bir reaksiyon geldi" bilgisini yayıyoruz.
    await pusherServer.trigger(`room-${roomId}`, "reaction-received", {
      userId:   session.user.id,
      username: session.user.name || "Anonim",
      emoji:    emoji,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[REACTION_ERROR]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

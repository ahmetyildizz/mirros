import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, createSession } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rateLimit";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { username, avatarUrl, passcode } = await req.json();

    // ADMIN RECLAIM LOGIC — passcode env'den okunur, kaynak kodda hardcoded değil
    const adminPasscode = process.env.ADMIN_RECLAIM_PASSCODE;
    const adminTargetUsername = process.env.ADMIN_USERNAME ?? "Noyan";

    if (adminPasscode && username === adminTargetUsername && passcode) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const { allowed, remaining } = await rateLimit(`admin-reclaim:${ip}`, { max: 3, windowMs: 15 * 60_000 });
      if (!allowed) {
        await createAuditLog({
          action: "UPDATE",
          entityType: "USER",
          entityId: user.id,
          resource: `Admin reclaim brute-force attempt from ${ip}`,
          userId: user.id,
          details: { ip, username }
        });
        return NextResponse.json({ error: "Çok fazla deneme. 15 dakika bekle." }, { status: 429 });
      }

      if (passcode === adminPasscode) {
        const adminUser = await db.user.findUnique({ where: { username: adminTargetUsername } });
        if (adminUser) {
          await createAuditLog({
            action: "UPDATE",
            entityType: "USER",
            entityId: adminUser.id,
            resource: `Admin reclaim successful from ${ip}`,
            userId: user.id,
            details: { ip, remaining }
          });
          await createSession(adminUser.id, adminUser.username!, true);
          return NextResponse.json({ success: true, username: adminUser.username, reclaimed: true, isAdmin: true });
        }
      } else {
        await createAuditLog({
          action: "UPDATE",
          entityType: "USER",
          entityId: user.id,
          resource: `Admin reclaim failed — wrong passcode from ${ip}`,
          userId: user.id,
          details: { ip, remaining }
        });
        return NextResponse.json({ error: "Hatalı passcode" }, { status: 403 });
      }
    }

    const updateData: any = {};
    
    if (username) {
      if (username.length < 3) {
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
      updateData.username = username;
    }

    if (avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Güncellenecek veri bulunamadı" }, { status: 400 });
    }

    const oldUsername = user.username;

    // Update DB
    const updated = await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // AUDIT LOG
    await createAuditLog({
      action: "UPDATE",
      entityType: "USER",
      entityId: updated.id,
      resource: `User renamed from ${oldUsername} to ${updated.username}`,
      oldValue: oldUsername || "unknown",
      newValue: updated.username!,
      userId: user.id
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

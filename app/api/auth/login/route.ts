import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rateLimit";
import { createAuditLog } from "@/lib/audit";

import { verifyGoogleToken, verifyAppleToken } from "@/lib/auth/verify";

const bodySchema = z.object({
  username: z.string().min(2).max(20).regex(/^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ ]+$/, "Harf, rakam, boşluk ve _ kullanabilirsin").optional(),
  provider: z.enum(["GUEST", "GOOGLE", "APPLE"]).default("GUEST"),
  deviceId: z.string().optional(),
  token:    z.string().optional(), // Sosyal giriş tokenı
});

export async function POST(req: NextRequest) {
  const ip  = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = rateLimit(`login:${ip}`, { max: 10, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "Çok fazla deneme. 1 dakika bekle." }, { status: 429 });
  }

  const json = await req.json();
  const body = bodySchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }

  const { username: requestedName, provider, deviceId, token } = body.data;

  let finalUsername = requestedName;
  let finalEmail    = "";
  let providerId    = "";
  let avatarUrl: string | null = null;

  // 1. Sosyal Giriş Token Doğrulaması
  if (provider !== "GUEST") {
    if (!token) return NextResponse.json({ error: "Token gerekli" }, { status: 400 });
    
    const socialData = provider === "GOOGLE" 
      ? await verifyGoogleToken(token) 
      : await verifyAppleToken(token);

    if (!socialData) {
      return NextResponse.json({ error: "Kimlik doğrulaması başarısız" }, { status: 401 });
    }

    providerId    = socialData.providerId;
    finalEmail    = socialData.email || `${providerId}@social.mirros.app`;
    finalUsername = socialData.name || requestedName || "Sosyal Kullanıcı";
    avatarUrl     = (socialData as any).picture || null;
  } else {
    // Guest Girişi
    if (!requestedName) return NextResponse.json({ error: "İsim gerekli" }, { status: 400 });
    finalUsername = requestedName;
    finalEmail    = `${finalUsername.toLowerCase().replace(/\s/g, '.')}@mirros.app`;
  }

  // 2. Kullanıcıyı Bul (Sosyal ise providerId, Guest ise username üzerinden)
  let user = provider !== "GUEST" 
    ? await db.user.findUnique({ where: { providerId } })
    : await db.user.findUnique({ where: { username: finalUsername } });

  // 3. E-posta üzerinden eşleştirme (ProviderId yoksa ama e-posta uyuşuyorsa)
  if (!user && provider !== "GUEST" && finalEmail) {
    user = await db.user.findUnique({ where: { email: finalEmail } });
    if (user) {
      // Hesabı sosyal kimliğe bağla
      user = await db.user.update({
        where: { id: user.id },
        data: { 
          providerId, 
          provider,
          avatarUrl: avatarUrl || user.avatarUrl 
        }
      });
    }
  }

  if (user) {
    // 4. Kimlik Kontrolü & Güvenlik
    if (provider === "GUEST") {
      if (user.provider !== "GUEST") {
        return NextResponse.json({ error: "Bu isim bir sosyal hesaba bağlı. Lütfen Google/Apple ile gir." }, { status: 403 });
      }
      if (user.deviceId && user.deviceId !== deviceId) {
        return NextResponse.json({ error: "Bu isim başka bir cihaza ait. Başka isim seçin." }, { status: 403 });
      }
      // Cihazı yoksa kilitle
      if (!user.deviceId && deviceId) {
        user = await db.user.update({ where: { id: user.id }, data: { deviceId } });
      }
    }
  } else {
    // 5. Yeni Kullanıcı Oluştur
    user = await db.user.create({
      data: {
        username: finalUsername,
        email:    finalEmail,
        provider,
        avatarUrl,
        providerId: provider !== "GUEST" ? providerId : null,
        deviceId:   provider === "GUEST" ? deviceId : null,
      },
    });
  }

  await createAuditLog({
    action: "LOGIN",
    entityType: "USER",
    entityId: user.id,
    resource: `User ${user.username} logged in via ${provider}`,
    userId: user.id,
    details: { provider, deviceId: deviceId ? "present" : "none" }
  });

  await createSession(user.id, user.username || "User");
  return NextResponse.json({ 
    ok: true, 
    provider, 
    username: user.username,
    userId: user.id 
  });
}

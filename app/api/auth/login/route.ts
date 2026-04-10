import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rateLimit";
import { createAuditLog } from "@/lib/audit";

const bodySchema = z.object({
  username: z.string().min(2).max(20).regex(/^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ ]+$/, "Harf, rakam, boşluk ve _ kullanabilirsin"),
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

  const { username, provider, deviceId, token } = body.data;

  // 1. Kullanıcıyı bul
  let user = await db.user.findUnique({
    where: { username },
  });

  if (user) {
    // 2. Kimlik Kontrolü (GUEST ise cihaz kilidi)
    if (provider === "GUEST") {
      if (user.provider !== "GUEST") {
        return NextResponse.json({ error: "Bu isim bir sosyal hesaba bağlı. Lütfen Google/Apple ile gir." }, { status: 403 });
      }
      if (user.deviceId && user.deviceId !== deviceId) {
        return NextResponse.json({ error: "Bu isim başka bir cihaza ait. Lütfen başka bir isim seç." }, { status: 403 });
      }
      // Aynı cihaz veya cihazı henüz yoksa güncelle
      if (!user.deviceId && deviceId) {
        user = await db.user.update({ where: { id: user.id }, data: { deviceId } });
      }
    } else {
      // Sosyal Giriş Kontrolü (İleride token doğrulaması buraya gelecek)
      if (user.provider !== provider) {
         return NextResponse.json({ error: `Bu isim zaten ${user.provider} ile kayıtlı.` }, { status: 403 });
      }
    }
  } else {
    // 3. Yeni Kullanıcı Oluştur
    // Social Login simülasyonu: E-posta isme göre üretilir
    const email = provider === "GUEST" ? `${username}@mirros.app` : `${username.toLowerCase().replace(/\s/g, '.')}@social.mirros.app`;
    
    user = await db.user.create({
      data: {
        username,
        email,
        provider,
        deviceId: provider === "GUEST" ? deviceId : null,
      },
    });
  }

  await createAuditLog({
    action: "LOGIN",
    entityType: "USER",
    entityId: user.id,
    resource: `User ${username} logged in via ${provider}`,
    userId: user.id,
    details: { provider, deviceId: deviceId ? "present" : "none" }
  });

  await createSession(user.id, username);
  return NextResponse.json({ ok: true, provider, username: user.username });
}

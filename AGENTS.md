<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Mirros — AI Ortak Çalışma Kuralları

Bu repo'da **Claude** ve **Gemini** birlikte çalışmaktadır. Aşağıdaki kurallara her iki AI da uyar.

## Her Oturuma Başlarken (ZORUNLU)

1. `WORKLOG.md` dosyasını oku — diğer AI'ın son oturumda ne yaptığını öğren
2. `git log --oneline -10` çalıştır — son commit'leri gözden geçir
3. Çakışma riski varsa kullanıcıya bildir, üzerine yazmadan önce sor

## Her Oturum Sonunda (ZORUNLU)

1. Yaptığın değişiklikleri commit et (açıklayıcı mesajla)
2. `WORKLOG.md` dosyasının **en üstüne** (ilk `---` bloğunun üstüne) şu formatla not ekle:

```
## YYYY-MM-DD — [Claude|Gemini]

- Yapılan iş özeti (hangi dosyalar, ne değişti)
- Açık kalan sorunlar veya dikkat çekilmesi gerekenler
- Sonraki adım önerisi (opsiyonel)

---
```

## Genel Kurallar

- **Başkasının yazdığı kodu silme veya büyük ölçüde yeniden yazma** — önce kullanıcıya sor
- Aynı dosyada çalışıyorsanız git diff ile önce mevcut durumu anla
- Mimari kararları commit mesajına veya WORKLOG'a yaz, ilerideki AI anlasın
- `prisma/schema.prisma` değişikliklerini her zaman WORKLOG'a not et

## Proje Stack

- **Framework:** Next.js 16 (App Router)
- **DB:** PostgreSQL + Prisma 7
- **Auth:** NextAuth
- **UI:** Tailwind + shadcn/ui
- **Realtime:** polling veya SSE (WebSocket yok)
- **Deploy:** Vercel

## Kritik Dosyalar

| Dosya/Klasör | Açıklama |
|---|---|
| `app/api/rooms/` | Oda yönetimi API |
| `app/api/rounds/[roundId]/` | Tur mantığı |
| `app/api/auth/` | NextAuth config |
| `app/game/[roomId]/` | Oyun ekranı (ana mantık burada) |
| `app/(lobby)/room/` | Lobi ekranı |
| `prisma/schema.prisma` | DB şeması |
| `WORKLOG.md` | **Her oturumda güncelle** |

# Mirros Release Checklist

## BLOCKER — Yapılmadan release olmaz

- [ ] **Soru metni Pusher'da yok**: `game.service.ts` → `createRound` question'ı join etmiyor; `round-started` payload'ına `questionText` + `questionCategory` ekle
- [ ] **WaitingRoom stub**: `app/(lobby)/room/[roomId]/page.tsx` → Pusher `player-joined` event'ini dinle, game-started event'inde `/game/[roomId]`'ye yönlendir
- [ ] **Results sayfası stub**: `app/results/[gameId]/page.tsx` → gerçek veri çek, familiarity + per-round skorları göster
- [ ] **Magic link bağlanmamış**: `app/(auth)/login/page.tsx` → `setTimeout` mock'u kaldır, NextAuth `signIn("email", {...})` bağla
- [ ] **`game-started` event'i room channel'da**: WaitingRoom bu event'i dinleyerek `/game/[roomId]`'ye geçmeli — şu an dinlenmiyor

## HIGH — Kısa sürede düzeltilmeli

- [ ] **Insights endpoint yok**: `POST /api/insights/[gameId]` → rule-based insight metni üret, store'da `insight` field'ı dolu değil
- [ ] **Race condition — double score**: Score endpoint idempotent ama `advanceGame` transaction dışında; DB transaction ile sar
- [ ] **`requireAuth` score route'da user kontrolü yok**: Herhangi auth'lu user score tetikleyebilir — round player olup olmadığını doğrula
- [ ] **`NEXT_PUBLIC_PUSHER_KEY` prod değeri**: `.env.example`'da `your-key` → deployment öncesi gerçek Pusher creds set et

## MEDIUM — MVP sonrası

- [ ] **Sayfa yenileme = oyun kaybı**: Zustand persist eklenmemiş; `gameId` localStorage'a persist et
- [ ] **Reconnect stratejisi**: Pusher drop → missed event recovery yok; `/api/rounds/current` endpoint ekle
- [ ] **Input maxLength**: `AnswerInput`/`GuessInput` Zod'da max=120 var ama UI'da `maxLength` attribute yok
- [ ] **Loading state**: Answer/guess submit sonrası buton disabled değil — çift submit mümkün
- [ ] **Error boundary**: API hataları silent fail; kullanıcıya toast/error göster

## Ortam / Deployment

- [ ] Docker Compose ayakta mı: `docker-compose up -d` → postgres + redis
- [ ] Migration çalıştırıldı mı: `npx prisma migrate deploy`
- [ ] Seed yapıldı mı: `npx prisma db seed` → 50 soru
- [ ] `.env` dolduruldu mu: DATABASE_URL, NEXTAUTH_SECRET, PUSHER_* tüm değerler
- [ ] `npm run build` hatasız tamamlanıyor mu
- [ ] TypeScript: `npx tsc --noEmit` → şu an temiz ✓

## Riskler

| Risk | Olasılık | Etki |
|------|----------|------|
| Soru metni Pusher'da yok → oyun kırık | KESİN | CRITICAL |
| WaitingRoom yönlendirme yok → oyun başlamıyor | KESİN | CRITICAL |
| Magic link bağlanmamış → giriş yapılamıyor | KESİN | CRITICAL |
| Pusher creds eksik → real-time yok | YÜKSEK | CRITICAL |
| Race condition → çift round | DÜŞÜK | HIGH |
| Sayfa yenileme → oyun kaybı | YÜKSEK | MEDIUM |

## MVP Tamamlanma Durumu

```
Auth            ▓▓▓▓▓▓▓▓░░  80%  (signIn mock bağlanmamış)
Lobby           ▓▓▓▓▓▓▓▓▓░  90%  (WaitingRoom stub)
Game            ▓▓▓▓▓▓▓▓░░  80%  (soru metni eksik, Results stub)
Scoring         ▓▓▓▓▓▓▓▓▓▓ 100%  ✓
Real-time       ▓▓▓▓▓▓▓▓░░  80%  (WaitingRoom dinlemiyor)
Insights        ▓▓░░░░░░░░  20%  (endpoint yok)
```

**Tahmini kalan iş: 3 blocker × ~1 saat = ~3 saat**

# Mirros — Ortak Çalışma Günlüğü

> Bu dosya Claude ve Gemini tarafından ortaklaşa tutulur.
> Her oturum sonunda çalışan AI buraya kısa not düşer.
> Format: `## YYYY-MM-DD — [Claude|Gemini]`

---

## 2026-04-20 — Gemini

- **[ISIM] Yer Tutucu Düzeltmesi:** SOCIAL modunda sorularda çıkan `[ISIM]` ve `[İSİM]` yer tutucuları o anki odak oyuncunun ismiyle değiştirilecek şekilde güncellendi.
  - `QuestionCard.tsx`: İsim değiştirme mantığı eklendi.
  - `app/game/[roomId]/page.tsx`: Odak oyuncu ismi (`focusName`) bileşene aktarıldı.
  - `TvDisplay.tsx`: TV ekranındaki soru metni için isim değiştirme mantığı uygulandı.
- **QR Akış Optimizasyonu:** QR kod ile davetlerde 'Oda Kodu' giriş ekranı otomatik atlanarak doğrudan 'Karakter Seçimi' ekranına geçiş sağlandı.
  - `JoinRoom.tsx`: Otomatik doğrulama sırasında kullanıcıyı bekleten özel bir yükleme ekranı eklendi.

---

## 2026-04-18 — Gemini

- **Sosyal Özellikler Entegrasyonu:** (Badges, Spy Mode, Reactions, Avatars)
  - **Prisma & DB:** `GameMode.SPY` eklendi, `User.badges` ve `User.aiAvatar` alanları eklendi.
  - **AI Servisleri:** `SPY_PROMPT` ile casus modu soru üretimi ve `analyzeGameWithGemini` ile otomatik rozet (Badge) saptama mantığı kuruldu.
  - **Canlı Reaksiyonlar:** `ReactionOverlay` ve `ReactionToolbar` bileşenleri eklendi. Pusher üzerinden emoji ve SFX (komik sesler) senkronizasyonu sağlandı.
  - **Casus Modu (SPY):** 1 Casus vs N Vatandaş mantığı kuruldu. Casus yakalanırsa vatandaşlar (+5), yakalanmazsa casus (+10) puan alır.
  - **AI Avatars:** DiceBear API entegrasyonu ile yeni katılan kullanıcılara otomatik premium avatarlar atandı.
  - **Rozet Sistemi:** Oyun sonunda kazanılan rozetlerin kullanıcı profilinde kalıcı olarak saklanması ve sonuç ekranında gösterilmesi sağlandı.
- **Teknik:** `score/route.ts` ve `game.service.ts` mod bazlı puanlama ve round yönetimi için güncellendi.

---

## 2026-04-17 — Gemini

- **Dedikodu Masası (EXPOSE) Canlı Testi:** 10 turluk tam bir oyun akışı canlı sistemde (`mirros.vercel.app`) simüle edildi.
  - TestHost (Tarayıcı) ve TestGuest (Script) rolleriyle 2 kişilik senaryo başarıyla tamamlandı.
  - Oylama, oyların Pusher üzerinden senkronizasyonu ve kurban kartı (Exposed) gösterimi doğrulandı.
  - Oyunun final liderlik tablosuna kadar kesintisiz ilerlediği görüldü.
- **Bot Script:** Canlı API üzerinden oyun akışını test etmek için `scratch/tester_bot.js` ve `scratch/bot_session.json` araçları oluşturuldu.

---

## 2026-04-17 — Claude (viral büyüme — share card, davet linki)

### Share Card — AI Tag Entegrasyonu
- `components/results/ShareButton.tsx` — tamamen yeniden yazıldı:
  - `aiTag` prop eklendi: kartın merkezine büyük "Mirros Yapay Zeka Yorumu" bloğu eklendi
  - `winner` prop eklendi: altın rozet olarak gösteriliyor
  - Paylaşım metni: `Mirros diyor ki: "{aiTag}"` satırı dahil edildi
  - 9:16 story formatı korundu, görsel hiyerarşi iyileştirildi (AI tag > uyum skoru > komik an)
- `components/results/ResultsClient.tsx` — `ShareButton`'a `aiTag={aiReport.tag}` ve `winner={top3[0]?.username}` iletildi

### Davet Linki — `/join/[code]`
- `app/join/[code]/page.tsx` — yeni sayfa: kodu sanitize edip `/?code=CODE` ye server-side redirect
- `app/(lobby)/room/[roomId]/page.tsx` — tüm davet URL'leri `/join/${roomCode}` formatına güncellendi:
  - `handleCopy`: `/?code=` → `/join/`
  - `handleWhatsApp`: `/?code=` → `/join/` + WhatsApp mesajı sadeleştirildi
  - QR kodu: `joinUrl` değişkenini kullanıyor (artık `/join/` prefix'li)
  - `joinUrl` tek bir değişkende toplanıp tüm yerlerde kullanılıyor

---

## 2026-04-17 — Claude (AI soru üretimi — viral & kişiselleştirilmiş)

### Yapılan
- `lib/prompts/question-gen.ts` — tamamen yeniden yazıldı:
  - `SOCIAL_PROMPT`: Oyuncu isimleriyle kişiselleştirilmiş, "tam seni anlatan" sorular
  - `EXPOSE_PROMPT`: Spice level bazlı (EASY/MEDIUM/HARD), gerçek isimlerle grup dinamiği soruları
  - `QUIZ_PROMPT`: Yaş grubuna göre (CHILD/ADULT/WISE), "bunu bilmiyordum!" beklenmedik gerçekler
  - Her mod için viral soru kategorileri ve şık yazım kuralları tanımlandı

- `lib/services/ai.service.ts` — tamamen yeniden yazıldı:
  - `generateSocialQuestions()` / `generateExposeQuestions()` / `generateQuizQuestions()` — mod bazlı
  - `generateAndSaveQuestionsForRoom()` — **oyuncu isimleriyle kişisel sorular** + DB'ye oda-özel kaydeder
  - `refillGlobalPool()` — global havuz dolumu (oda bağımsız)
  - `analyzeGameWithGemini()` korundu

- `lib/services/game.service.ts` — AI entegrasyonu:
  - `startGame()`: Oyun başlarken `generateAndSaveQuestionsForRoom()` çağrılır (non-blocking)
    - Gerçek oyuncu isimleri Gemini'ye gönderilir → kişisel sorular üretilir → `roomId` ile kaydedilir
    - `pickQuestion()` oda-özel soruları önce seçtiği için her oyunda taze sorular gelir
  - `pickQuestion()`: Havuz `LOW_WATER_MARK (5)` altına düşünce `refillGlobalPool()` arka planda tetiklenir

- `app/api/rooms/route.ts`: `generateQuestionsWithAI` → `refillGlobalPool` (eski fonksiyon kaldırıldı)
- `app/api/questions/generate/route.ts` — **yeni endpoint**: Admin için manuel soru üretimi (POST)

### Nasıl Çalışır
1. Oda oluşturulunca → global havuz arka planda doldurulur
2. Oyun başlayınca → oyuncu isimleriyle 12 kişisel soru üretilir, `roomId` ile kaydedilir
3. `pickQuestion()` → önce oda-özel sorular, yoksa global havuz
4. Global havuz < 5 soru → otomatik 15 soru daha üretilir
5. `GOOGLE_GEMINI_API_KEY` eksikse → static havuza graceful fallback

---

## 2026-04-17 — Claude (pre-existing TS fixleri + P2 tamamlama)

### Pre-existing TS Hataları
- `components/lobby/CreateRoom.tsx:54` — `onStepChange` Props'ta tanımlıydı ama component destructure etmiyordu, eklendi
- `app/login/page.tsx` — `@capawesome/capacitor-google-sign-in` API değişiklikleri temizlendi:
  - `GoogleSignIn.initialize()` çağrılarından `redirectUri` (geçersiz field) kaldırıldı
  - `GoogleSignIn.signIn()` çağrısından `clientId`, `serverClientId`, `redirectUrl`, `redirectUri` kaldırıldı (tip tanımında yok)
  - `result.authentication.accessToken` → kaldırıldı (`SignInResult`'ta yok; username backend'de token'dan türetiliyor)

### P2 — Rate Limiter Redis Migrasyonu
- `lib/rateLimit.ts` — In-process `Map` tabanlı sayaç yerine Redis (`lib/redis.ts` client kullanarak)
  - `rateLimit()` artık `async` — `redis.incr()` + `redis.pExpire()` ile atomik sayım
  - Serverless/multi-instance ortamlarda tüm instance'lar aynı sayacı paylaşır
- `app/api/auth/login/route.ts:19` — `rateLimit()` çağrısına `await` eklendi

### P2 — Admin/History N+1 Optimizasyonu
- `app/api/admin/history/route.ts` — Büyük sorgu yeniden yazıldı:
  - Sayfalama eklendi: `?page=1&limit=20` (varsayılan 20, max 50)
  - Round detaylarından `answers` ve `guesses` include'ları kaldırıldı (list view için gereksiz)
  - 3 ayrı COUNT sorgusu → `db.$transaction([...])` ile tek tur
  - `games`, `stats`, `auditLogs` sorguları `Promise.all` ile paralel çalışıyor
  - Response'a `pagination: { page, limit, total }` eklendi

---

## 2026-04-17 — Claude (kapsamlı fix turu — build + P0/P1/P2)

### Build Fixleri
- `app/game/[roomId]/page.tsx` — orphaned closing tags kaldırıldı (506-509 arası), FlashbackCard indentation düzeltildi
- `app/(lobby)/room/[roomId]/page.tsx` — `.map()` callback'inde eksik `))}` eklendi
- `hooks/useGameState.ts:237` — `setGuessProgress` useRoomState'te destructure edilmemişti, eklendi

### P0 Güvenlik
- `middleware.ts` — `/api/admin/seed` PUBLIC_PATHS'tan çıkarıldı

### P1 Güvenlik
- `middleware.ts` + `lib/auth/session.ts` — DEV bypass `!== "production"` → `=== "development"` (staging koruması)
- `lib/auth/session.ts` — isAdmin dev bypass'ta `true` → `false`; `sameSite: "lax"` → `"strict"`
- `lib/auth/verify.ts` — hardcoded Google CLIENT_ID fallback kaldırıldı, env yoksa throw
- `app/api/admin/history/route.ts` — admin kontrolü eksikti (`session.isAdmin` kontrolü eklendi)

### P1 Oyun Mantığı
- `app/api/rounds/[roundId]/guess/route.ts` — 2-player edge case: `totalGuessers >= 2` → `>= 1`
- `app/api/rounds/[roundId]/answer/route.ts` — Quiz Türkçe normalizasyon: `toLowerCase()` → `toLocaleLowerCase("tr")`

### P2 İyileştirmeler
- `lib/pusher/server.ts` — `safeTrigger()` wrapper eklendi (hataları loglar, throw etmez)
- Tüm API route'larında `pusherServer.trigger` → `safeTrigger` geçildi (7 dosya)
- `app/error.tsx` oluşturuldu — App-level Error Boundary
- `app/global-error.tsx` oluşturuldu — Global Error Boundary (root layout çöküşleri için)
- `app/api/admin/seed/route.ts` — Prisma enum type cast düzeltildi

### Açık Kalanlar
- `components/lobby/CreateRoom.tsx:68` — `onStepChange` pre-existing TS hatası (Gemini'nin dokunduğu kod)
- `app/login/page.tsx` — Google SDK API değişikliği (`webClientId` → `clientId`) pre-existing
- Rate limiter hâlâ in-process — serverless'ta Redis'e taşınmalı (P2)
- N+1: admin/history heavy query, results page — refactor gerekli (P2)

---

## 2026-04-17 — Claude (P1 game state fixleri)

- `score/route.ts` — EXPOSE winner: case-insensitive match + tie → rastgele kazanan
- `game.service.ts` — startGame race condition: existingGame kontrolü transaction'a taşındı
- `useGameState.ts` — tüm Pusher handler'larına try/catch eklendi
- Build önceden zaten bozuk (`app/game/[roomId]/page.tsx` syntax hataları — benim değişiklerimden değil)
- **Açık P0:** seed endpoint PUBLIC (`middleware.ts:8`) — henüz dokunulmadı

---

## 2026-04-17 — Claude (audit + agent kurulum)

- Kapsamlı audit tamamlandı: 87 bulgu (3 P0, 20 P1, 35 P2, 29 P3)
- Audit raporu kaydedildi: `docs/audit_2026-04-17.md`
- 3 agent oluşturuldu: `mirros-security-fixer`, `mirros-game-state-debugger`, `mirros-performance-optimizer`
- 3 skill oluşturuldu: `mirros-audit`, `mirros-fix-security`, `mirros-fix-game-state`
- **Açık P0'lar:** seed endpoint PUBLIC, EXPOSE winner string match, startGame race condition
- **Sonraki önerilen adım:** P0 güvenlik fixleri (`mirros-fix-security` skill ile başla)

---

## 2026-04-17 — Gemini

- **Focused Mode UI:** QR Join ve Create Room (Config aşaması) için ana sayfadaki tüm dikkat dağıtıcı öğeler (Günün sorusu, VEYA ayracı vb.) gizlendi.
- **Stale State Reset:** Lobiye dönüldüğünde eski kategori isimlerinin (örn: 'Çift Gecesi') ve temaların kalması sorunu `useGameStore.reset()` ile giderildi.
- **Expose Mode Sync:** Spectator'ların round bitişini engellemesi/bozması PLAYER rolü filtrelemesiyle çözüldü.
- **QR Flow Bypass:** QR ile girişte 'Devam Et' adımı atlanarak doğrudan profil seçimine yönlendirme sağlandı.

---

## 2026-04-17 — Claude (kurulum)

- WORKLOG.md, CLAUDE.md, AGENTS.md coordination sistemi kuruldu
- Son bilinen durum: expose mode sync, lobby reset, QR join flow düzeltildi (bkz. git log)
- Açık sorunlar: bilinmiyor — Gemini devam etmekteydi

---

<!-- Yeni notları en ÜSTE ekle (bu satırın altına değil, başlık bloğunun üstüne) -->

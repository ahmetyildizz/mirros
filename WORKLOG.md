# Mirros — Ortak Çalışma Günlüğü

> Bu dosya Claude ve Gemini tarafından ortaklaşa tutulur.
> Her oturum sonunda çalışan AI buraya kısa not düşer.
> Format: `## YYYY-MM-DD — [Claude|Gemini]`

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

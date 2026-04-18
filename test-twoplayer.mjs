/**
 * İki oyunculu canlı oyun testi
 * Çalıştır: node test-twoplayer.mjs
 */
import puppeteer from 'C:/Users/ahmet/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-puppeteer/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const BASE = 'https://mirros.vercel.app';
const DELAY = (ms) => new Promise(r => setTimeout(r, ms));

async function screenshot(page, name) {
  await page.screenshot({ path: `/tmp/${name}.png`, fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function guestLogin(page, username) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  // Misafir butonu
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('misafir'));
    if (btn) btn.click();
  });
  await DELAY(500);
  await page.type('input', username);
  await DELAY(200);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('OYUNA BAŞLA'));
    if (btn) btn.click();
  });
  // Login tamamlanana kadar bekle
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
  await DELAY(1000);
  console.log(`  ✅ Giriş: ${username} → ${page.url()}`);
}

async function clickText(page, text) {
  return page.evaluate((t) => {
    const el = Array.from(document.querySelectorAll('button, [role=button]'))
      .find(b => b.textContent.includes(t));
    if (el) { el.click(); return true; }
    return false;
  }, text);
}

(async () => {
  console.log('\n🎮 Mirros İki Oyunculu Test Başlıyor...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 390, height: 844 },
  });

  // İki bağımsız tarayıcı context'i (farklı cookie/session)
  const ctx1 = await browser.createBrowserContext();
  const ctx2 = await browser.createBrowserContext();
  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();

  // Pencereleri yan yana diz
  const targets = await browser.targets();
  try {
    const cdp1 = await p1.createCDPSession();
    await cdp1.send('Browser.setWindowBounds', { windowId: 1, bounds: { left: 0, top: 0, width: 400, height: 900 } });
    const cdp2 = await p2.createCDPSession();
    await cdp2.send('Browser.setWindowBounds', { windowId: 2, bounds: { left: 410, top: 0, width: 400, height: 900 } });
  } catch(e) {}

  try {
    // ── 1. Her iki oyuncu giriş yapsın ──────────────────────────────
    console.log('1️⃣  Giriş yapılıyor...');
    const un1 = 'P1Host' + Math.floor(Math.random()*1000);
    const un2 = 'P2Guest' + Math.floor(Math.random()*1000);

    await Promise.all([
      guestLogin(p1, un1),
      guestLogin(p2, un2),
    ]);

    await screenshot(p1, '01_p1_login');
    await screenshot(p2, '01_p2_login');

    // ── 2. P1 oda oluşturur ──────────────────────────────────────────
    console.log('\n2️⃣  P1 oda oluşturuyor...');
    const roomData = await p1.evaluate(async () => {
      const r = await fetch('/api/rooms', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ gameMode: 'SOCIAL', totalRounds: 3, maxPlayers: 4 })
      });
      return r.json();
    });
    const roomId = roomData.id;
    const roomCode = roomData.code;
    console.log(`  Oda: ${roomCode} (${roomId})`);

    // P1 oda lobisine git
    await p1.goto(`${BASE}/room/${roomId}`, { waitUntil: 'networkidle2' });
    await screenshot(p1, '02_p1_lobby');

    // ── 3. P2 odaya katılır ─────────────────────────────────────────
    console.log('\n3️⃣  P2 odaya katılıyor...');
    await p2.goto(`${BASE}/join/${roomCode}`, { waitUntil: 'networkidle2' });
    await DELAY(1500);
    await screenshot(p2, '03_p2_join');
    await screenshot(p1, '03_p1_lobby_2players');

    // Katıl butonuna bas (eğer varsa)
    await clickText(p2, 'KATIL');
    await DELAY(1000);

    // ── 4. P1 oyunu başlatır ────────────────────────────────────────
    console.log('\n4️⃣  P1 oyunu başlatıyor...');
    const gameData = await p1.evaluate(async (rId) => {
      const r = await fetch('/api/games', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ roomId: rId })
      });
      return r.json();
    }, roomId);
    const gameId = gameData.game?.id;
    console.log(`  Oyun ID: ${gameId}`);
    console.log(`  Round 1 answererId: ${gameData.round?.answererId}`);

    // Her iki oyuncu oyun sayfasına git
    await Promise.all([
      p1.goto(`${BASE}/game/${roomId}`, { waitUntil: 'networkidle2' }),
      p2.goto(`${BASE}/game/${roomId}`, { waitUntil: 'networkidle2' }),
    ]);
    await DELAY(2000);

    await screenshot(p1, '04_p1_game_start');
    await screenshot(p2, '04_p2_game_start');

    // ── 5. Oyun döngüsü (3 round) ───────────────────────────────────
    console.log('\n5️⃣  Oyun oynuyor...\n');

    for (let round = 1; round <= 3; round++) {
      console.log(`  ── Round ${round} ──`);

      // Game state'i çek
      const state = await p1.evaluate(async (gId) => {
        const r = await fetch(`/api/games/${gId}`);
        return r.json();
      }, gameId);

      console.log(`  State: ${state.state}, Answerer: ${state.answererId}`);
      const roundId = state.activeRoundId;

      if (state.state === 'ANSWERING') {
        // Kim cevaplıyorsa o sayfadan cevap gönder
        const answererPage = state.answererId ? p1 : p2; // basit heuristic
        // Gerçek answerer'ı bul
        const myId1 = await p1.evaluate(async () => {
          const r = await fetch('/api/me'); const d = await r.json(); return d.id;
        });
        const answerer = state.answererId === myId1 ? p1 : p2;
        const guesser  = state.answererId === myId1 ? p2 : p1;
        const pName    = state.answererId === myId1 ? 'P1' : 'P2';

        console.log(`  ${pName} cevaplıyor...`);
        const opts = state.question?.options || [];
        const answer = opts[0] || 'Test cevabı';

        // UI'dan seç (eğer cevaplayan görüyorsa)
        const clicked = await answerer.evaluate((ans) => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes(ans));
          if (btn) { btn.click(); return true; }
          return false;
        }, answer);

        if (clicked) {
          await DELAY(500);
          await clickText(answerer, 'GÖNDER');
        } else {
          // API üzerinden gönder
          await answerer.evaluate(async (rId, ans) => {
            await fetch(`/api/rounds/${rId}/answer`, {
              method: 'POST', headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ content: ans })
            });
          }, roundId, answer);
        }

        await DELAY(1500);
        await screenshot(p1, `05_r${round}_answered_p1`);
        await screenshot(p2, `05_r${round}_answered_p2`);

        // Guesser tahmin etsin
        const gName = pName === 'P1' ? 'P2' : 'P1';
        console.log(`  ${gName} tahmin ediyor...`);

        const guessed = await guesser.evaluate((ans) => {
          const input = document.querySelector('input');
          if (input) {
            input.focus();
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(input, ans);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return 'input_found';
          }
          // Çoktan seçmeli ise buton bul
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes(ans));
          if (btn) { btn.click(); return 'button_clicked'; }
          return 'not_found';
        }, answer);

        console.log(`  Guess UI: ${guessed}`);

        if (guessed === 'input_found') {
          await DELAY(300);
          await clickText(guesser, 'TAHMİN ET');
        } else if (guessed === 'button_clicked') {
          await DELAY(300);
          await clickText(guesser, 'GÖNDER');
        } else {
          // API fallback
          await guesser.evaluate(async (rId, ans) => {
            await fetch(`/api/rounds/${rId}/guess`, {
              method: 'POST', headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ content: ans })
            });
          }, roundId, answer);
        }

        await DELAY(1500);
      }

      // Skor hesapla
      console.log(`  Skor hesaplanıyor...`);
      const scoreRes = await p1.evaluate(async (rId) => {
        const r = await fetch(`/api/rounds/${rId}/score`, { method: 'POST' });
        return r.json();
      }, roundId);
      console.log(`  Skor sonucu:`, JSON.stringify(scoreRes.playerScores || scoreRes.error || 'ok'));

      await DELAY(1500);
      await screenshot(p1, `06_r${round}_score_p1`);
      await screenshot(p2, `06_r${round}_score_p2`);

      // "Sıradaki Tura Geç" butonuna bas
      await clickText(p1, 'SIRADAKİ');
      await DELAY(1000);
    }

    // ── 6. Sonuç ekranı ─────────────────────────────────────────────
    await DELAY(2000);
    await screenshot(p1, '07_p1_final');
    await screenshot(p2, '07_p2_final');

    const finalUrl1 = p1.url();
    const finalUrl2 = p2.url();
    console.log(`\n✅ Test tamamlandı!`);
    console.log(`  P1 son URL: ${finalUrl1}`);
    console.log(`  P2 son URL: ${finalUrl2}`);
    console.log(`\n📁 Ekran görüntüleri: /tmp/0*.png\n`);

  } catch (err) {
    console.error('\n❌ Hata:', err.message);
    await screenshot(p1, 'ERROR_p1').catch(() => {});
    await screenshot(p2, 'ERROR_p2').catch(() => {});
  } finally {
    // Tarayıcıyı açık bırak — kullanıcı görebilsin
    console.log('Tarayıcılar açık. Kapatmak için Ctrl+C.');
    // await browser.close();
  }
})();

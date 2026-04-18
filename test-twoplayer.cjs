/**
 * İki oyunculu canlı oyun testi — CommonJS
 * Çalıştır: node test-twoplayer.cjs
 */
const puppeteer = require('C:/Users/ahmet/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-puppeteer/node_modules/puppeteer');

const BASE  = 'https://mirros.vercel.app';
const DELAY = (ms) => new Promise(r => setTimeout(r, ms));

async function screenshot(page, name) {
  try {
    await page.screenshot({ path: `C:/tmp/${name}.png` });
    console.log(`  📸 ${name}.png`);
  } catch(e) { console.log(`  (screenshot skip: ${e.message})`); }
}

async function guestLogin(page, username) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 15000 });

  // "Misafir Olarak Giriş Yap" butonuna bas
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.toLowerCase().includes('misafir'));
    if (btn) btn.click();
  });

  // Input alanının gelmesini bekle
  await page.waitForSelector('input', { timeout: 5000 });
  await DELAY(300);

  // React ile uyumlu input doldurma: focus → tıkla → yaz
  await page.click('input');
  await page.keyboard.type(username, { delay: 50 });
  await DELAY(200);

  // Değerin girdiğini doğrula
  const val = await page.$eval('input', el => el.value);
  console.log(`  Input değeri: "${val}"`);

  // Butonu aktifleştirmek için bir kez daha event gönder
  await page.evaluate((v) => {
    const input = document.querySelector('input');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, v);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, username);
  await DELAY(300);

  // OYUNA BAŞLA butonuna bas
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('OYUNA BAŞLA'));
    if (btn) btn.click();
  });

  // Anasayfaya yönlenmeyi bekle (max 15s)
  try {
    await page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 15000, polling: 500 }
    );
  } catch(e) {}
  await DELAY(600);
  console.log(`  ✅ ${username} giriş yaptı → ${page.url()}`);
}

async function clickText(page, text) {
  return page.evaluate((t) => {
    const el = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes(t));
    if (el) { el.click(); return true; }
    return false;
  }, text);
}

async function apiCall(page, url, method = 'GET', body = null) {
  return page.evaluate(async (u, m, b) => {
    const opts = { method: m, headers: { 'Content-Type': 'application/json' } };
    if (b) opts.body = JSON.stringify(b);
    const r = await fetch(u, opts);
    const text = await r.text();
    if (!text || !text.trim()) return { _status: r.status, _empty: true };
    try { return JSON.parse(text); } catch(e) { return { _raw: text.slice(0, 200) }; }
  }, url, method, body);
}

(async () => {
  console.log('\n🎮 Mirros İki Oyunculu Test\n');

  // mkdir C:/tmp
  const fs = require('fs');
  if (!fs.existsSync('C:/tmp')) fs.mkdirSync('C:/tmp', { recursive: true });

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 390, height: 844 },
  });

  const ctx1 = await browser.createBrowserContext();
  const ctx2 = await browser.createBrowserContext();
  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();

  // Pencereleri yan yana konumlandır
  try {
    const session1 = await p1.target().createCDPSession();
    const { windowId: w1 } = await session1.send('Browser.getWindowForTarget');
    await session1.send('Browser.setWindowBounds', { windowId: w1, bounds: { left: 0, top: 0, width: 410, height: 900 } });

    const session2 = await p2.target().createCDPSession();
    const { windowId: w2 } = await session2.send('Browser.getWindowForTarget');
    await session2.send('Browser.setWindowBounds', { windowId: w2, bounds: { left: 420, top: 0, width: 410, height: 900 } });
  } catch(e) { console.log('  (pencere konumlandırma atlandı)'); }

  try {
    // ── 1. GİRİŞ ──────────────────────────────────────────────────
    console.log('1️⃣  Giriş yapılıyor...');
    const r = Math.floor(Math.random() * 9000) + 1000;
    const un1 = `Host${r}`;
    const un2 = `Guest${r}`;
    await Promise.all([ guestLogin(p1, un1), guestLogin(p2, un2) ]);
    await Promise.all([ screenshot(p1, '01_p1_home'), screenshot(p2, '01_p2_home') ]);

    // ── 2. ODA OLUŞTUR ────────────────────────────────────────────
    console.log('\n2️⃣  P1 oda oluşturuyor...');
    const room = await apiCall(p1, '/api/rooms', 'POST', { gameMode: 'SOCIAL', totalRounds: 3, maxPlayers: 4 });
    console.log(`  Kod: ${room.code}  ID: ${room.id}`);

    await p1.goto(`${BASE}/room/${room.id}`, { waitUntil: 'networkidle2', timeout: 10000 });
    await screenshot(p1, '02_p1_lobby');

    // ── 3. P2 KATIL ───────────────────────────────────────────────
    console.log('\n3️⃣  P2 odaya katılıyor...');
    const joinResult = await apiCall(p2, '/api/rooms/join', 'POST', { code: room.code });
    console.log(`  Katılanlar: ${joinResult.players?.map(p => p.username).join(', ')}`);

    await p2.goto(`${BASE}/room/${room.id}`, { waitUntil: 'networkidle2', timeout: 10000 });
    await DELAY(1500);
    await Promise.all([ screenshot(p1, '03_p1_lobby_2p'), screenshot(p2, '03_p2_lobby') ]);

    // ── 4. OYUNU BAŞLAT ───────────────────────────────────────────
    console.log('\n4️⃣  Oyun başlatılıyor...');
    const gameStart = await apiCall(p1, '/api/games', 'POST', { roomId: room.id });
    const gameId = gameStart.game?.id;
    console.log(`  Game ID: ${gameId}`);

    await Promise.all([
      p1.goto(`${BASE}/game/${room.id}`, { waitUntil: 'networkidle2', timeout: 10000 }),
      p2.goto(`${BASE}/game/${room.id}`, { waitUntil: 'networkidle2', timeout: 10000 }),
    ]);
    await DELAY(2000);
    await Promise.all([ screenshot(p1, '04_p1_game'), screenshot(p2, '04_p2_game') ]);

    // Oyuncu ID'lerini al
    const me1 = await apiCall(p1, '/api/me');
    const me2 = await apiCall(p2, '/api/me');
    console.log(`  P1: ${un1} (${me1.id?.slice(-6)})`);
    console.log(`  P2: ${un2} (${me2.id?.slice(-6)})`);

    // ── 5. 3 ROUND OYNA ──────────────────────────────────────────
    console.log('\n5️⃣  Oyun oynuyor...');

    for (let round = 1; round <= 3; round++) {
      console.log(`\n  ── Round ${round} ──`);

      const state = await apiCall(p1, `/api/games/${gameId}`);
      if (!state.activeRoundId) { console.log('  aktif round yok, duruyorum'); break; }

      const roundId   = state.activeRoundId;
      const answId    = state.answererId;
      const isP1Answ  = answId === me1.id;
      const answerer  = isP1Answ ? p1 : p2;
      const guesser   = isP1Answ ? p2 : p1;
      const aName     = isP1Answ ? un1 : un2;
      const gName     = isP1Answ ? un2 : un1;
      const opts      = state.question?.options || [];
      const answer    = opts[0] || 'Test';

      console.log(`  Cevaplayan: ${aName}  |  Soru: ${state.question?.text?.slice(0, 45)}...`);
      console.log(`  Seçenekler: ${opts.join(' / ')}`);

      // Cevap gönder
      if (state.state === 'ANSWERING') {
        // UI üzerinden cevap seç
        const uiClicked = await answerer.evaluate((ans) => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ans);
          if (btn) { btn.click(); return true; }
          return false;
        }, answer);

        if (uiClicked) {
          await DELAY(400);
          await clickText(answerer, 'GÖNDER');
          console.log(`  ${aName} UI'dan cevap verdi: "${answer}"`);
        } else {
          await apiCall(answerer, `/api/rounds/${roundId}/answer`, 'POST', { content: answer });
          console.log(`  ${aName} API'dan cevap verdi: "${answer}"`);
        }
        await DELAY(2000);
        await Promise.all([ screenshot(p1, `05_r${round}_answered_p1`), screenshot(p2, `05_r${round}_answered_p2`) ]);
      }

      // Tahmin gönder
      const state2 = await apiCall(p1, `/api/games/${gameId}`);
      if (state2.state === 'GUESSING') {
        // UI üzerinden tahmin yap (input varsa)
        const guessUI = await guesser.evaluate((ans) => {
          const input = document.querySelector('input[placeholder*="ahmin"]') || document.querySelector('input');
          if (input) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(input, ans);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return 'input';
          }
          // MultipleChoice butonu
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ans);
          if (btn) { btn.click(); return 'button'; }
          return 'none';
        }, answer);

        if (guessUI === 'input') {
          await DELAY(300);
          await clickText(guesser, 'TAHMİN ET');
          console.log(`  ${gName} UI'dan tahmin etti: "${answer}"`);
        } else if (guessUI === 'button') {
          await DELAY(300);
          await clickText(guesser, 'GÖNDER');
          console.log(`  ${gName} UI butondan tahmin etti: "${answer}"`);
        } else {
          await apiCall(guesser, `/api/rounds/${roundId}/guess`, 'POST', { content: answer });
          console.log(`  ${gName} API'dan tahmin etti: "${answer}"`);
        }
        await DELAY(1500);
      }

      // Skor hesapla (state zaten ilerlediyse atla)
      await DELAY(1000);
      const stateCheck = await apiCall(p1, `/api/games/${gameId}`);
      if (stateCheck.currentRound > round) {
        console.log(`  (Skor otomatik hesaplandı, round ${stateCheck.currentRound}'e geçildi)`);
      } else {
        const scoreRes = await apiCall(p1, `/api/rounds/${roundId}/score`, 'POST');
        if (scoreRes.error) {
          console.log(`  Skor: ${scoreRes.error} (409/zaten hesaplandı olabilir)`);
        } else {
          const scores = scoreRes.playerScores || stateCheck.playerScores || {};
          const p1pts = scores[me1.id] || 0;
          const p2pts = scores[me2.id] || 0;
          console.log(`  Skor — ${un1}: ${p1pts}  ${un2}: ${p2pts}`);
        }
      }

      await DELAY(1500);
      await Promise.all([ screenshot(p1, `06_r${round}_score_p1`), screenshot(p2, `06_r${round}_score_p2`) ]);

      // SIRADAKİ TURA GEÇ
      await clickText(p1, 'SIRADAKİ');
      await DELAY(1000);
    }

    // ── 6. BİTİŞ ─────────────────────────────────────────────────
    await DELAY(2500);
    await Promise.all([ screenshot(p1, '07_p1_end'), screenshot(p2, '07_p2_end') ]);

    console.log(`\n✅ Test tamamlandı!`);
    console.log(`  P1 URL: ${p1.url()}`);
    console.log(`  P2 URL: ${p2.url()}`);
    console.log('\n📁 Ekranlar: C:/tmp/0*.png');

  } catch (err) {
    console.error('\n❌ HATA:', err.message);
    console.error(err.stack?.split('\n').slice(0,4).join('\n'));
    await Promise.all([
      screenshot(p1, 'ERR_p1').catch(() => {}),
      screenshot(p2, 'ERR_p2').catch(() => {}),
    ]);
  }

  console.log('\nTarayıcılar açık. Kapatmak için Ctrl+C basın.');
})();

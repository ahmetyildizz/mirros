# Mirros QA Pack

## 1. Core Game Flow

### TC-001: Room Creation
- Host creates room → 6-char code generated → code shown with copy button
- Code unique: collision loop creates new code if taken
- Room status = WAITING on creation

### TC-002: Room Join
- Guest enters valid code → joined → room status = ACTIVE
- Invalid code → 404 response
- Already-active room (guestId present) → cannot rejoin as new guest

### TC-003: Game Start
- Host clicks Start → `POST /api/games` → game created, Round 1 fired
- Round 1: roundNumber=1 (odd) → host is answerer
- Pusher `round-started` received by both clients

### TC-004: Answer Submission
- Answerer submits → `POST /api/rounds/[id]/answer` → Pusher `answer-submitted`
- Guesser's UI switches to GuessInput
- Answerer sees "Karşı taraf tahmin ediyor..." waiting message

### TC-005: Guess + Scoring
- Guesser submits → `POST /api/rounds/[id]/guess` → `POST /api/rounds/[id]/score`
- ScoreReveal shows matchLevel (EXACT / CLOSE / WRONG)
- Score added to store via `addScore`

### TC-006: Round Advancement
- After scoring: `advanceGame` called automatically
- Round 2: roundNumber=2 (even) → guest is answerer, host is guesser
- Roles alternate correctly every round

### TC-007: Game End (Round 5)
- After round 5 scored → `game-finished` Pusher event
- Both clients redirect to `/results/[gameId]`
- `familiarity` percentage displayed

---

## 2. Scoring Logic

### TC-010: Exact Match
- `"pizza"` vs `"pizza"` → EXACT (10pts)
- Case-insensitive: `"Pizza"` vs `"pizza"` → EXACT
- Turkish chars: `"şeker"` vs `"seker"` → EXACT (after normalize)

### TC-011: Close Match
- Levenshtein ≤ 2: `"pizza"` vs `"piza"` → CLOSE (5pts)
- Token overlap ≥ 70%: `"deniz kenarı"` vs `"deniz kıyısı"` — tokens: 1/2 = 50% → WRONG
- `"kahve içmek"` vs `"kahve"` — overlap 1/2 = 50% → check lev: lev("kahve içmek","kahve")=7 → WRONG ✓

### TC-012: Wrong Match
- Completely different strings → WRONG (0pts)
- Empty guess → WRONG

### TC-013: Familiarity Calculation
- 5 rounds × all EXACT = 50pts → 50/(5×10)×100 = 100%
- 5 rounds × all WRONG = 0pts → 0%
- 3 EXACT + 2 WRONG = 30pts → 60%

---

## 3. Edge Cases

### EC-001: Duplicate Answer Submission
- Answerer submits twice → second call should be idempotent or return error
- Backend: Answer model has `roundId` — check for existing before insert

### EC-002: Guess Before Answer
- Guesser tries to submit before answer exists → `POST /api/rounds/[id]/score` will fail (no answer to compare)
- Guard: check answer exists before scoring

### EC-003: Score Called Twice
- Score endpoint called twice for same round → `advanceGame` fires twice → creates duplicate rounds
- Guard: check round status = SCORED before proceeding

### EC-004: Page Refresh Mid-Game
- Player refreshes during ANSWERING → `gameId` in Zustand store is lost (non-persistent)
- Result: redirected to `/` (gameId null)
- **Known limitation / MVP gap**: no session recovery

### EC-005: Question Pool Exhausted
- `advanceGame` runs `findFirst` on Question — all questions used → still returns random question (no dedup)
- Could repeat same question in same game for long games (>50 rounds — not MVP concern)

### EC-006: Long Answer Text
- Very long answer (1000 chars) vs short guess → scoring still works (Levenshtein O(n×m))
- UI: AnswerInput/GuessInput should have maxLength cap (e.g. 280)

### EC-007: Turkish Special Characters in Scoring
- `"çikolata"` vs `"cikolata"` → normalize maps both to `"cikolata"` → EXACT ✓
- `"şişe"` vs `"şise"` → lev=1 → CLOSE ✓

---

## 4. Multiplayer / Real-time Issues

### MP-001: Pusher Connection Drop
- Client disconnects → reconnects → misses Pusher event
- Risk: stuck on ANSWERING if `answer-submitted` missed
- Mitigation: add reconnect handler that fetches current round state via REST

### MP-002: Race Condition — Double Score
- Two clients both call score endpoint simultaneously
- Prisma upsert / transaction needed on Score creation
- Without guard: two Score rows, two `advanceGame` calls, two new rounds

### MP-003: Role Mismatch on Reconnect
- If `myRole` lost from store on reconnect → wrong input shown
- Pusher `round-started` re-fires on reconnect? No — missed events not replayed
- Fix: `/api/rounds/current?gameId=...` endpoint to restore state

### MP-004: Both Players Click "Next Round"
- SCORING state has "Sonraki Round" button — both players can click
- Both call `setGameState("ANSWERING")` locally (client-only)
- Actual advancement driven by Pusher `round-started` — no double-round risk
- UI: button should be shown only to one player OR disabled after first click

### MP-005: Guest Joins After Game Started
- Room in ACTIVE status, game already running → late joiner gets no `round-started` event
- Guard: if room has active game → return error on join

### MP-006: Pusher Channel Cleanup
- `useGameState` unsubscribes on unmount via cleanup function ✓
- Risk: if component remounts (StrictMode double-invoke) → duplicate subscriptions
- Singleton pusher client pattern mitigates this

### MP-007: Simultaneous Answer + Guess
- Guesser submits before answerer in ANSWERING state (impossible via UI but API unguarded)
- Round status guards: ACTIVE → answer accepted, ANSWERED → guess accepted, GUESSED → score accepted

---

## 5. Auth / Session

### AUTH-001: Unauthenticated API Access
- All `/api/rounds/*` and `/api/games` endpoints — `requireAuth()` called? 
- **Check**: score/route.ts, answer/route.ts, guess/route.ts — verify `requireAuth()` is in each
- If missing: anonymous users can submit answers

### AUTH-002: Wrong User Submitting Answer
- Answerer role is player A, player B tries to call answer endpoint
- Guard: compare `session.user.id` vs `round.answererId`

### AUTH-003: Magic Link Expiry
- VerificationToken expires → login fails gracefully
- NextAuth handles this natively

---

## 6. Priority Matrix

| ID | Severity | Status |
|----|----------|--------|
| EC-003 (double score) | CRITICAL | Open |
| MP-002 (race condition) | CRITICAL | Open |
| AUTH-001 (unguarded endpoints) | HIGH | Open |
| AUTH-002 (wrong user submits) | HIGH | Open |
| MP-001 (reconnect) | HIGH | Open — MVP gap |
| EC-001 (duplicate answer) | MEDIUM | Open |
| MP-004 (both click next) | LOW | Open |
| EC-004 (page refresh) | LOW | Known limitation |

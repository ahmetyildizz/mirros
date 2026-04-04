let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.25) {
  try {
    const c   = getCtx();
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.connect(g);
    g.connect(c.destination);
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + dur);
  } catch {}
}

function isMuted() {
  return typeof localStorage !== "undefined" && localStorage.getItem("mirros_sound") === "off";
}

export const sounds = {
  tick:    () => { if (!isMuted()) tone(700, 0.07, "sine", 0.12); },
  submit:  () => { if (!isMuted()) { tone(523, 0.08, "sine", 0.18); setTimeout(() => tone(659, 0.12, "sine", 0.18), 80); } },
  exact:   () => { if (!isMuted()) { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.18, "sine", 0.22), i * 100)); } },
  close:   () => { if (!isMuted()) { tone(440, 0.1, "sine", 0.18); setTimeout(() => tone(523, 0.15, "sine", 0.18), 90); } },
  wrong:   () => { if (!isMuted()) { tone(330, 0.1, "sine", 0.18); setTimeout(() => tone(277, 0.18, "triangle", 0.12), 90); } },
  newRound:() => { if (!isMuted()) { tone(880, 0.05, "sine", 0.1); setTimeout(() => tone(1100, 0.1, "sine", 0.1), 60); } },
  fanfare: () => { if (!isMuted()) { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.28, "sine", 0.22), i * 130)); } },
};

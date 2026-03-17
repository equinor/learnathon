// sounds.js — Web Audio API sound effects for ceremony
// Pentatonic scale frequencies
const NOTES = {
  C3: 130.81, C4: 261.63, D4: 293.66, E4: 329.63,
  G4: 392.00, A4: 440.00, C5: 523.25,
};

let audioCtx = null;
let soundMuted = localStorage.getItem('learnathon-ceremony-muted') === 'true';

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function tone(freq, startTime, duration, gain = 0.1) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function play(fn) {
  if (soundMuted) return;
  try { fn(getCtx()); } catch (_) {}
}

// --- Sound cues ---

function playTeamCalledUp() {
  play(ctx => {
    const t = ctx.currentTime;
    [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5].forEach((f, i) =>
      tone(f, t + i * 0.12, 0.2, 0.1));
  });
}

function playPresentationStart() {
  play(ctx => tone(NOTES.G4, ctx.currentTime, 0.3, 0.12));
}

function playWarning30s() {
  play(ctx => {
    const t = ctx.currentTime;
    tone(NOTES.A4, t, 0.1, 0.08);
    tone(NOTES.A4, t + 0.2, 0.1, 0.08);
  });
}

function playTimeUp() {
  play(ctx => {
    const t = ctx.currentTime;
    [NOTES.C5, NOTES.G4, NOTES.E4].forEach((f, i) =>
      tone(f, t + i * 0.15, 0.4, 0.12));
  });
}

function playApplause() {
  play(ctx => {
    const t = ctx.currentTime;
    [NOTES.C4, NOTES.E4, NOTES.G4].forEach(f =>
      tone(f, t, 1.5, 0.15));
  });
}

function playVotingOpens() {
  play(ctx => {
    const t = ctx.currentTime;
    tone(NOTES.C4, t, 0.15, 0.1);
    tone(NOTES.E4, t + 0.15, 0.15, 0.1);
  });
}

function playVotingCloses() {
  play(ctx => {
    const t = ctx.currentTime;
    tone(NOTES.E4, t, 0.15, 0.1);
    tone(NOTES.C4, t + 0.15, 0.15, 0.1);
  });
}

function playRevealFinalists() {
  play(ctx => {
    const t = ctx.currentTime;
    for (let i = 0; i < 16; i++) {
      const f = i % 2 === 0 ? NOTES.C4 : NOTES.E4;
      tone(f, t + i * 0.125, 0.12, 0.08);
    }
  });
}

function playRevealWinner() {
  play(ctx => {
    const t = ctx.currentTime;
    [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5].forEach((f, i) =>
      tone(f, t + i * 0.12, 0.2, 0.12));
    // Held chord
    setTimeout(() => {
      [NOTES.C4, NOTES.E4, NOTES.G4].forEach(f =>
        tone(f, getCtx().currentTime, 1.0, 0.15));
    }, 500);
  });
}

function playTiebreakerAnnounced() {
  play(ctx => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(NOTES.C3, t);
    osc.frequency.linearRampToValueAtTime(NOTES.C4, t + 1.5);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.5);
  });
}

function playStarTap() {
  play(ctx => {
    const f = [NOTES.C4, NOTES.D4, NOTES.E4, NOTES.G4, NOTES.A4][Math.floor(Math.random() * 5)];
    tone(f, ctx.currentTime, 0.15, 0.08);
  });
}

function toggleMute() {
  soundMuted = !soundMuted;
  localStorage.setItem('learnathon-ceremony-muted', soundMuted);
  if (!soundMuted) getCtx();
  return soundMuted;
}

function isMuted() { return soundMuted; }

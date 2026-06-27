const SOUND_ENABLED_KEY = "order-update-sound-enabled";

let audioContext = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  return audioContext;
};

export const unlockOrderUpdateSound = async () => {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }

  return ctx.state === "running";
};

const playTone = (frequency, startTime, duration, volume = 0.12) => {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
};

const playPattern = (tones) => {
  const ctx = getAudioContext();
  if (!ctx) return false;

  const start = ctx.currentTime + 0.02;
  tones.forEach((tone, index) => {
    const offset = tones
      .slice(0, index)
      .reduce((sum, item) => sum + item.duration + (item.gap || 0.08), 0);
    playTone(tone.frequency, start + offset, tone.duration, tone.volume ?? 0.12);
  });

  return true;
};

const STATUS_PATTERNS = {
  ready: [
    { frequency: 880, duration: 0.14, volume: 0.14 },
    { frequency: 1175, duration: 0.18, volume: 0.14 },
    { frequency: 880, duration: 0.14, volume: 0.12 },
  ],
  accepted: [
    { frequency: 660, duration: 0.12, volume: 0.1 },
    { frequency: 880, duration: 0.16, volume: 0.12 },
  ],
  delivered: [{ frequency: 523, duration: 0.22, volume: 0.1 }],
  cancelled: [{ frequency: 220, duration: 0.28, volume: 0.1 }],
  declined: [{ frequency: 220, duration: 0.28, volume: 0.1 }],
  placed: [{ frequency: 587, duration: 0.14, volume: 0.1 }],
};

export const isOrderUpdateSoundEnabled = () =>
  sessionStorage.getItem(SOUND_ENABLED_KEY) !== "0";

export const setOrderUpdateSoundEnabled = (enabled) => {
  sessionStorage.setItem(SOUND_ENABLED_KEY, enabled ? "1" : "0");
};

export const playOrderUpdateSound = async (status) => {
  if (!isOrderUpdateSoundEnabled()) return false;

  const unlocked = await unlockOrderUpdateSound();
  if (!unlocked) return false;

  const key = String(status || "").toLowerCase();
  const pattern = STATUS_PATTERNS[key] || [
    { frequency: 740, duration: 0.15, volume: 0.11 },
    { frequency: 988, duration: 0.15, volume: 0.11 },
  ];

  return playPattern(pattern);
};

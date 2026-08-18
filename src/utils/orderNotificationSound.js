const SOUND_ENABLED_KEY = "order-update-sound-enabled";

let audioContext = null;
let fallbackAudio = null;

const FALLBACK_BEEP_SRC =
  "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUrvT18=";

const DEFAULT_PATTERN = [
  { frequency: 740, duration: 0.12, volume: 0.12 },
  { frequency: 988, duration: 0.12, volume: 0.12 },
];

const getAudioContext = () => {
  if (typeof window === "undefined") return null;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioContext) {
    audioContext = new AudioCtx({ latencyHint: "interactive" });
  }

  return audioContext;
};

const getFallbackAudio = () => {
  if (typeof window === "undefined") return null;

  if (!fallbackAudio) {
    fallbackAudio = new Audio(FALLBACK_BEEP_SRC);
    fallbackAudio.preload = "auto";
    fallbackAudio.volume = 0.45;
  }

  return fallbackAudio;
};

export const unlockOrderUpdateSound = async () => {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === "running") return true;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }

  return ctx.state === "running";
};

/** Sync resume inside a user-gesture handler (Pay tap, pointerdown). */
export const unlockOrderUpdateSoundSync = () => {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === "running") return true;

  if (ctx.state === "suspended") {
    try {
      ctx.resume();
    } catch {
      return false;
    }
  }

  return ctx.state === "running";
};

const playTone = (frequency, startTime, duration, volume = 0.12) => {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return false;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(volume * 0.85, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
  return true;
};

const playPattern = (tones) => {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return false;

  const start = ctx.currentTime;
  let played = false;

  tones.forEach((tone, index) => {
    const offset = tones
      .slice(0, index)
      .reduce((sum, item) => sum + item.duration + (item.gap || 0.04), 0);
    if (playTone(tone.frequency, start + offset, tone.duration, tone.volume ?? 0.12)) {
      played = true;
    }
  });

  return played;
};

const playFallbackBeep = () => {
  const audio = getFallbackAudio();
  if (!audio) return false;

  try {
    audio.currentTime = 0;
    void audio.play();
    return true;
  } catch {
    return false;
  }
};

const STATUS_PATTERNS = {
  ready: [
    { frequency: 880, duration: 0.12, volume: 0.16 },
    { frequency: 1175, duration: 0.14, volume: 0.16 },
    { frequency: 880, duration: 0.12, volume: 0.14 },
  ],
  preparing: [
    { frequency: 740, duration: 0.1, volume: 0.12 },
    { frequency: 988, duration: 0.12, volume: 0.13 },
  ],
  accepted: [
    { frequency: 660, duration: 0.1, volume: 0.12 },
    { frequency: 880, duration: 0.12, volume: 0.14 },
  ],
  delivered: [{ frequency: 523, duration: 0.18, volume: 0.12 }],
  cancelled: [{ frequency: 220, duration: 0.22, volume: 0.12 }],
  declined: [{ frequency: 220, duration: 0.22, volume: 0.12 }],
  placed: [{ frequency: 587, duration: 0.12, volume: 0.11 }],
};

export const isOrderUpdateSoundEnabled = () =>
  sessionStorage.getItem(SOUND_ENABLED_KEY) !== "0";

export const setOrderUpdateSoundEnabled = (enabled) => {
  sessionStorage.setItem(SOUND_ENABLED_KEY, enabled ? "1" : "0");
};

export const playOrderUpdateSound = (status) => {
  if (!isOrderUpdateSoundEnabled()) return false;

  const key = String(status || "").toLowerCase();
  const pattern = STATUS_PATTERNS[key] || DEFAULT_PATTERN;
  const ctx = getAudioContext();

  if (ctx?.state === "running" && playPattern(pattern)) {
    return true;
  }

  void unlockOrderUpdateSound().then((unlocked) => {
    if (unlocked && playPattern(pattern)) return;
    playFallbackBeep();
  });

  return false;
};

/** Attach listeners so the next user tap unlocks audio (needed after payment redirect). */
export const bindOrderUpdateSoundUnlock = () => {
  if (typeof document === "undefined") return () => {};

  const unlock = () => {
    unlockOrderUpdateSoundSync();
  };

  document.addEventListener("pointerdown", unlock);
  document.addEventListener("keydown", unlock);
  document.addEventListener("touchstart", unlock, { passive: true });

  return () => {
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("keydown", unlock);
    document.removeEventListener("touchstart", unlock);
  };
};

export const notifyOrderStatusSound = ({ status, previousStatus }) => {
  if (!status || status === previousStatus) return false;
  return playOrderUpdateSound(status);
};

/** Warm up audio objects on pages that listen for order updates. */
export const primeOrderNotificationSound = () => {
  getAudioContext();
  getFallbackAudio();
};

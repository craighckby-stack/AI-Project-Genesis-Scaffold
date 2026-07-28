let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

type SoundType = 'select' | 'move' | 'capture' | 'check' | 'gameover';

interface SoundConfig {
  type: OscillatorType;
  freq: number | number[];
  duration: number;
  gain: number;
  delay?: number;
}

const SOUND_MAP: Record<SoundType, SoundConfig[]> = {
  select: [{ type: 'sine', freq: 440, duration: 0.08, gain: 0.05 }],
  move: [{ type: 'triangle', freq: [180, 110], duration: 0.06, gain: 0.12 }],
  capture: [{ type: 'square', freq: [160, 60], duration: 0.12, gain: 0.15 }],
  check: [
    { type: 'sine', freq: 580, duration: 0.15, gain: 0.08 },
    { type: 'sine', freq: 720, duration: 0.15, gain: 0.08, delay: 0.08 }
  ],
  gameover: [330, 392, 523, 659].map((f, i) => ({
    type: 'sine', freq: f, duration: 0.4, gain: 0.06, delay: i * 0.1
  }))
};

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

export function playSound(type: SoundType, soundEnabled: boolean): void {
  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const configs = SOUND_MAP[type];

    configs.forEach((cfg) => {
      const startTime = now + (cfg.delay || 0);
      const endTime = startTime + cfg.duration;
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = cfg.type;
      if (Array.isArray(cfg.freq)) {
        osc.frequency.setValueAtTime(cfg.freq[0], startTime);
        osc.frequency.exponentialRampToValueAtTime(cfg.freq[1], endTime);
      } else {
        osc.frequency.setValueAtTime(cfg.freq, startTime);
      }

      gainNode.gain.setValueAtTime(cfg.gain, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc.connect(gainNode);
      gainNode.connect(masterGain!);
      
      osc.start(startTime);
      osc.stop(endTime);

      // Cleanup nodes after playback finishes
      osc.onended = () => {
        osc.disconnect();
        gainNode.disconnect();
      };
    });
  } catch (e) {
    console.error('Audio playback failed:', e);
  }
}

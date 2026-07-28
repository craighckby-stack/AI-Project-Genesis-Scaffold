let audioCtx: AudioContext | null = null;

type SoundType = 'select' | 'move' | 'capture' | 'check' | 'gameover';

interface SoundConfig {
  type: OscillatorType;
  freq: number;
  duration: number;
  gain: number;
  delay?: number;
}

const SOUND_PROFILES: Record<SoundType, SoundConfig | SoundConfig[]> = {
  select: { type: 'sine', freq: 440, duration: 0.08, gain: 0.05 },
  move: { type: 'triangle', freq: 180, duration: 0.06, gain: 0.12 },
  capture: { type: 'square', freq: 160, duration: 0.12, gain: 0.15 },
  check: [
    { type: 'sine', freq: 580, duration: 0.15, gain: 0.08 },
    { type: 'sine', freq: 720, duration: 0.15, gain: 0.08, delay: 0.08 }
  ],
  gameover: [330, 392, 523, 659].map((f, i) => ({
    type: 'sine', freq: f, duration: 0.4, gain: 0.06, delay: i * 0.1
  }))
};

export function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

function playNode(ctx: AudioContext, config: SoundConfig, startTime: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const time = startTime + (config.delay || 0);

  osc.type = config.type;
  osc.frequency.setValueAtTime(config.freq, time);
  
  gain.gain.setValueAtTime(config.gain, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + config.duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(time);
  osc.stop(time + config.duration);

  // Cleanup nodes after playback to prevent memory leaks
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

export function playSound(type: SoundType, soundEnabled: boolean) {
  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const config = SOUND_PROFILES[type];
    const configs = Array.isArray(config) ? config : [config];
    
    configs.forEach(c => playNode(ctx, c, ctx.currentTime));
  } catch (error) {
    console.warn("Audio playback failed:", error);
  }
}



import { AudioContext } from 'web-audio-api-shim';

/**
 * SoundEngine v4.0: Unified Audio Synthesis & Narrative Atmosphere
 * Siphoned from: unitary-core / sovereign-kernel
 */

let audioCtx: AudioContext | null = null;
const activeNodes: Map<string, AudioNode | OscillatorNode> = new Map();

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function initAudioEngine() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.01);
  if (window.speechSynthesis) window.speechSynthesis.speak(new SpeechSynthesisUtterance(' '));
}

function cleanupNodes() {
  activeNodes.forEach((node) => {
    try { (node as any).stop?.(); (node as any).disconnect?.(); } catch (e) {}
  });
  activeNodes.clear();
}

export function playSynthSound(type: 'move' | 'capture' | 'check' | 'checkmate' | 'victory' | 'blip' | 'alarm', muted = false, volume = 0.5) {
  if (muted) return;
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(volume * 0.3, now);
  mainGain.connect(ctx.destination);

  // Logic consolidated for efficiency
  const osc = ctx.createOscillator();
  switch (type) {
    case 'move':
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
      break;
    case 'blip':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      break;
    default: break;
  }
  osc.connect(mainGain);
  osc.start(now);
  mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.stop(now + 0.16);
}

export function speakWithAtmosphere(text: string, config: { pitch: number, rate: number, type: 'dalek' | 'jesus' }, muted = false, volume = 0.5, onEnd?: () => void) {
  if (muted || !window.speechSynthesis) return onEnd?.();
  window.speechSynthesis.cancel();
  cleanupNodes();

  const utterance = new SpeechSynthesisUtterance(text.replace(/\[.*?\]/g, "").trim());
  utterance.pitch = config.pitch;
  utterance.rate = config.rate;
  
  utterance.onstart = () => {
    const ctx = getAudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = volume * 0.1;
    
    const osc = ctx.createOscillator();
    osc.type = config.type === 'dalek' ? 'sawtooth' : 'sine';
    osc.frequency.value = config.type === 'dalek' ? 120 : 220;
    osc.connect(gain);
    osc.start();
    activeNodes.set('drone', osc);
    activeNodes.set('gain', gain);
  };

  utterance.onend = () => { cleanupNodes(); onEnd?.(); };
  window.speechSynthesis.speak(utterance);
}

export const stopSpeaking = () => { window.speechSynthesis.cancel(); cleanupNodes(); };




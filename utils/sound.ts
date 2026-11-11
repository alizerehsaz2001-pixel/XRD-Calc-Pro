/**
 * Silent-by-default laboratory audio feedback utility.
 * Routine click/tab/slider tones ('tick', 'switch', 'action') are permanently suppressed
 * so the XRD suite behaves like a quiet laboratory instrument (HighScore Plus, GSAS-II, TOPAS).
 */
let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioContextClass();
  } else if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export const playSynthTone = (
  type: 'tick' | 'success' | 'error' | 'switch' | 'chime' | 'action' | 'xrd_scan' | 'xrd_beam'
) => {
  try {
    // Suppress all routine click, switch, and slider ticks unconditionally
    if (type === 'tick' || type === 'switch' || type === 'action') {
      return;
    }

    // Muted by default unless explicitly enabled by user in Settings
    const isSound = localStorage.getItem('xrd_sound') === 'true';
    if (!isSound) return;

    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    if (type === 'success' || type === 'chime' || type === 'xrd_scan' || type === 'xrd_beam') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.012, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else if (type === 'error') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.015, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    }
  } catch {
    // Silent fallback
  }
};

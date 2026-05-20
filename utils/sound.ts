/**
 * Web Audio-based scientific synthesizer soundboard
 * Integrates responsive retro chimes and beeps to reinforce tactile UI craftsmanship
 */
export const playSynthTone = (type: 'tick' | 'success' | 'error' | 'switch') => {
  try {
    const isSound = localStorage.getItem('xrd_sound') === 'true';
    if (!isSound) return;

    // Retrieve or initialize audio context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    if (type === 'tick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.008, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } 
    else if (type === 'success') {
      // Arpeggio chime
      const osc2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.06); // E5
      gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12); // G5
      osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.18); // C6
      gainNode2.gain.setValueAtTime(0.02, ctx.currentTime + 0.12);
      gainNode2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.35);
    } 
    else if (type === 'error') {
      // Dissonant descending synth-alarm
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } 
    else if (type === 'switch') {
      // Soft modern blip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
      osc.frequency.setValueAtTime(440.00, ctx.currentTime + 0.05); // A4
      gainNode.gain.setValueAtTime(0.015, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (e) {
    console.warn('Web Audio Playback blocked or unsupported:', e);
  }
};

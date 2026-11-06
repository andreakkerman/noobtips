import type { Tier } from './model';

// All sounds are original synthesis. No downloads, music loops or autoplay.
class ArcadeAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = false;
  async toggle(): Promise<boolean> {
    if (this.enabled) { this.enabled = false; this.master?.gain.setValueAtTime(0, this.context!.currentTime); return false; }
    try {
      this.context ??= new AudioContext();
      if (!this.master) { this.master = this.context.createGain(); this.master.connect(this.context.destination); }
      await this.context.resume();
      if (this.context.state !== 'running') { this.enabled = false; return false; }
      this.enabled = true; this.master.gain.setValueAtTime(0.18, this.context.currentTime); this.button(); return true;
    } catch { this.enabled = false; return false; }
  }
  private tone(frequency: number, duration: number, delay = 0, type: OscillatorType = 'sine', level = 0.3, end?: number) {
    if (!this.enabled || !this.context || !this.master) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator(); const gain = this.context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
    if (end) oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(level, start + 0.008); gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain); gain.connect(this.master); oscillator.start(start); oscillator.stop(start + duration + 0.02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    return () => { gain.gain.cancelScheduledValues(this.context!.currentTime); gain.gain.setValueAtTime(0,this.context!.currentTime); oscillator.stop(); };
  }
  button() { this.tone(180, 0.12, 0, 'triangle', 0.7, 80); this.tone(640, 0.08, 0.025, 'sine', 0.2); }
  spin() { this.button(); this.tone(65, 0.65, 0, 'triangle', 0.17, 200); }
  tick() { this.tone(700, 0.025, 0, 'triangle', 0.2, 350); }
  land() { this.tone(110, 0.3, 0, 'sine', 0.9, 45); this.tone(880, 0.18, 0.02, 'triangle', 0.25); }
  reveal(tier: Tier) {
    const notes = tier === 'legendary' ? [220, 330, 440, 554.37, 659.25, 880] : tier === 'mega' ? [261.63, 392, 523.25, 659.25] : [392, 523.25, 659.25];
    notes.forEach((note, i) => this.tone(note, 0.55, i * 0.075, 'sine', 0.24));
  }
  milestone() {
    this.tone(55, 1.8, 0, 'sine', .8, 36);
    [220,330,440,554.37,659.25,880].forEach((note,i) => this.tone(note, 1.7, .08+i*.065, 'triangle', .16));
  }
  junkImpact() {
    // Original short resonant metal thud, with a descending chassis vibration.
    const stops=[this.tone(95,.32,0,'sine',.85,38),this.tone(347,.22,.01,'triangle',.25,131),this.tone(911,.12,.045,'sine',.12,510)];
    return () => stops.forEach(stop=>stop?.());
  }
  rate(value: number) { this.tone(220 + value * 70, 0.12, 0, 'triangle', 0.35); this.tone(440 + value * 80, 0.22, 0.06, 'sine', 0.22); }
}
export const arcadeAudio = new ArcadeAudio();

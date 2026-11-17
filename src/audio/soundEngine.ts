class ProceduralSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private droneOscA: OscillatorNode | null = null;
  private droneOscB: OscillatorNode | null = null;
  private isEnabled = false;
  private isInitialized = false;

  private ensureContext(): boolean {
    if (typeof window === 'undefined') return false;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
    }

    if (!this.isInitialized && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);

      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.value = 140;
      this.droneFilter.Q.value = 1.6;

      const droneGain = this.ctx.createGain();
      droneGain.gain.value = 0.09;

      this.droneOscA = this.ctx.createOscillator();
      this.droneOscA.type = 'sine';
      this.droneOscA.frequency.value = 55; // A1

      this.droneOscB = this.ctx.createOscillator();
      this.droneOscB.type = 'triangle';
      this.droneOscB.frequency.value = 82.41; // E2 fifth
      this.droneOscB.detune.value = 4;

      this.droneOscA.connect(this.droneFilter);
      this.droneOscB.connect(this.droneFilter);
      this.droneFilter.connect(droneGain);
      droneGain.connect(this.masterGain);

      this.droneOscA.start();
      this.droneOscB.start();
      this.isInitialized = true;
    }

    return true;
  }

  public async setEnabled(enabled: boolean): Promise<boolean> {
    this.isEnabled = enabled;
    if (enabled) {
      const ok = this.ensureContext();
      if (!ok || !this.ctx || !this.masterGain) return false;
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.65, now, 0.25);
      this.playChime(523.25, 0.08, 0.22);
      return true;
    } else if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0, now, 0.12);
    }
    return false;
  }

  public updateScrollModulation(scrollProgress: number): void {
    if (!this.isEnabled || !this.ctx || !this.droneFilter) return;
    const clamped = Math.max(0, Math.min(1, scrollProgress));
    const targetFreq = 135 + Math.sin(clamped * Math.PI) * 190;
    this.droneFilter.frequency.setTargetAtTime(
      targetFreq,
      this.ctx.currentTime,
      0.15,
    );
  }

  public playHoverTick(): void {
    if (!this.isEnabled || !this.ctx || !this.masterGain) return;
    this.playChime(1318.5, 0.035, 0.09);
  }

  public playSelectChime(): void {
    if (!this.isEnabled || !this.ctx || !this.masterGain) return;
    this.playChime(440, 0.06, 0.28);
    setTimeout(() => {
      if (this.isEnabled) {
        this.playChime(659.25, 0.045, 0.35);
      }
    }, 55);
  }

  public playMorphSweep(): void {
    if (!this.isEnabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.42);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(480, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.42);
    filter.Q.value = 3.2;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.58);
  }

  private playChime(freq: number, volume: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public dispose(): void {
    try {
      this.droneOscA?.stop();
      this.droneOscB?.stop();
      if (this.ctx && this.ctx.state !== 'closed') {
        void this.ctx.close();
      }
    } catch {
      // Ignore cleanup errors on already closed context
    }
    this.ctx = null;
    this.isInitialized = false;
  }
}

export const soundEngine = new ProceduralSoundEngine();

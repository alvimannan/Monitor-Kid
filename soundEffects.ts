class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playSiren(durationMs = 3000) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      // Modulate frequency up and down like a siren
      const now = ctx.currentTime;
      for (let i = 0; i < durationMs / 1000; i += 0.4) {
        osc.frequency.setValueAtTime(700, now + i);
        osc.frequency.exponentialRampToValueAtTime(1400, now + i + 0.2);
        osc.frequency.exponentialRampToValueAtTime(700, now + i + 0.4);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + durationMs / 1000);
    } catch (e) {
      console.warn('AudioContext failed or blocked by browser policy:', e);
    }
  }

  public playNotificationBeep() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn('Notification beep error:', e);
    }
  }

  public playEmergencyAlarm() {
    this.playSiren(4500);
  }
}

export const soundEffects = new SoundEffects();

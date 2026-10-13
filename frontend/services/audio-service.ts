import { Platform } from 'react-native';

class WebAudioSynth {
  private ctx: any = null;
  private osc1: any = null;
  private osc2: any = null;
  private gain: any = null;
  public playing: boolean = false;

  play(freq = 136.1) {
    if (Platform.OS !== 'web') {
      this.playing = true;
      return;
    }

    try {
      if (!this.ctx) {
        // @ts-ignore
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (this.playing) return;

      this.gain = this.ctx.createGain();
      this.gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.gain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 2);

      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sine';
      this.osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime(freq * 1.5, this.ctx.currentTime);

      this.osc1.connect(this.gain);
      this.osc2.connect(this.gain);
      this.gain.connect(this.ctx.destination);

      this.osc1.start();
      this.osc2.start();
      this.playing = true;
    } catch (e) {
      this.playing = true;
    }
  }

  pause() {
    if (!this.playing) return;
    if (Platform.OS !== 'web' || !this.gain || !this.ctx) {
      this.playing = false;
      return;
    }

    try {
      this.gain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.ctx.currentTime + 0.5
      );
      setTimeout(() => {
        if (this.osc1) this.osc1.stop();
        if (this.osc2) this.osc2.stop();
        this.playing = false;
      }, 500);
    } catch (e) {
      this.playing = false;
    }
  }
}

export const audioSynth = new WebAudioSynth();

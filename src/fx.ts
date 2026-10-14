/**
 * TMC Awards - Visual and Sound Effects (FX) Engine
 * Confetti cannon, Web Audio chime synthesis, and particle sparkles.
 */

export class TMCFx {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    vRot: number;
    alpha: number;
  }> = [];
  private isRunning: boolean = false;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.init();
  }

  public init(): void {
    if (typeof document === 'undefined') return;
    this.canvas = document.getElementById('fxConfetti') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  private resize(): void {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  public confetti(x: number = window.innerWidth / 2, y: number = window.innerHeight / 2): void {
    if (!this.canvas) this.init();
    if (!this.ctx) return;

    const colors = ['#1f7a45', '#3dffa0', '#ffd700', '#3cc7d9', '#ffffff', '#e11d48'];
    const count = 90;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 9 + 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        alpha: 1
      });
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.render();
    }

    this.playCelebrationChime();
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.vRot;
      p.alpha -= 0.012;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.render());
    } else {
      this.isRunning = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  public playCelebrationChime(): void {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtxClass();

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Emerald chord)
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.audioCtx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.12, this.audioCtx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx!.currentTime + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(this.audioCtx!.currentTime + idx * 0.08);
        osc.stop(this.audioCtx!.currentTime + idx * 0.08 + 0.4);
      });
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }
}

declare global {
  interface Window {
    tmcFx?: TMCFx;
    confetti?: (x?: number, y?: number) => void;
  }
}

export function initFx(): TMCFx {
  const fx = new TMCFx();
  if (typeof window !== 'undefined') {
    window.tmcFx = fx;
    window.confetti = (x, y) => fx.confetti(x, y);
  }
  return fx;
}

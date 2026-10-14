/**
 * TMC Awards - Preload Animation with Minecraft Cup & Text
 * Renders an animated Minecraft Championship Trophy Cup with particle sparkles,
 * pulsating golden spotlight, and animated loading progress text.
 */

import { PreloadState } from './types.js';

export class TMCPreloader {
  private overlay: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private progressPercent: HTMLElement | null = null;
  private statusText: HTMLElement | null = null;
  private isDismissed: boolean = false;
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private duration: number = 1600; // 1.6s smooth cinematic entrance

  constructor() {
    this.init();
  }

  public init(): void {
    if (typeof document === 'undefined') return;

    this.overlay = document.getElementById('tmcPreloader');
    if (!this.overlay) {
      this.createOverlay();
    }

    this.progressBar = document.getElementById('preloadBarFill');
    this.progressPercent = document.getElementById('preloadPercent');
    this.statusText = document.getElementById('preloadStatusText');

    const skipBtn = document.getElementById('preloadSkipBtn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.dismiss());
    }

    this.startAnimation();
  }

  private createOverlay(): void {
    const el = document.createElement('div');
    el.id = 'tmcPreloader';
    el.className = 'preload-overlay';
    el.setAttribute('role', 'progressbar');
    el.setAttribute('aria-valuemin', '0');
    el.setAttribute('aria-valuemax', '100');
    el.setAttribute('aria-valuenow', '0');

    el.innerHTML = `
      <div class="preload-backdrop"></div>
      
      <!-- Ambient Sparkle Motes -->
      <div class="preload-motes">
        <span class="pm-spark s1">✦</span>
        <span class="pm-spark s2">★</span>
        <span class="pm-spark s3">✦</span>
        <span class="pm-spark s4">★</span>
        <span class="pm-spark s5">✦</span>
        <span class="pm-spark s6">✦</span>
      </div>

      <button type="button" class="preload-skip-btn" id="preloadSkipBtn" aria-label="Skip preload animation">
        <span>Skip</span>
        <span style="font-size:11px">✕</span>
      </button>

      <div class="preload-content">
        <!-- 3D Cup Stage with Spotlight -->
        <div class="preload-cup-stage" aria-label="TMC Golden Championship Trophy Cup">
          <div class="preload-spotlight"></div>
          <div class="preload-cup-aura"></div>
          
          <div class="preload-cup-wrap">
            <div class="mc-cup-preload">
              <div class="cup-spark-preload cs1">✦</div>
              <div class="cup-spark-preload cs2">✦</div>

              <!-- Top Bowl -->
              <div class="pcup-bowl-main">
                <div class="pcup-face pcup-gold pf-front">
                  <div class="pcup-jewel"></div>
                </div>
                <div class="pcup-face pcup-gold pf-back">
                  <div class="pcup-jewel"></div>
                </div>
                <div class="pcup-face pcup-gold pf-left"></div>
                <div class="pcup-face pcup-gold pf-right"></div>
                <div class="pcup-face pf-top"></div>
              </div>

              <!-- Left Handle -->
              <div class="pcup-handle ph-left">
                <div class="php-pixel p1"></div>
                <div class="php-pixel p2"></div>
                <div class="php-pixel p3"></div>
              </div>

              <!-- Right Handle -->
              <div class="pcup-handle ph-right">
                <div class="php-pixel p1"></div>
                <div class="php-pixel p2"></div>
                <div class="php-pixel p3"></div>
              </div>

              <!-- Lower Bowl -->
              <div class="pcup-bowl-low">
                <div class="pcup-face pcup-gold pf-front"></div>
                <div class="pcup-face pcup-gold pf-back"></div>
                <div class="pcup-face pcup-gold pf-left"></div>
                <div class="pcup-face pcup-gold pf-right"></div>
              </div>

              <!-- Stem -->
              <div class="pcup-stem">
                <div class="pcup-face pcup-stem-gold pf-front"></div>
                <div class="pcup-face pcup-stem-gold pf-back"></div>
                <div class="pcup-face pcup-stem-gold pf-left"></div>
                <div class="pcup-face pcup-stem-gold pf-right"></div>
              </div>

              <!-- Pedestal Layer 2 -->
              <div class="pcup-base2">
                <div class="pcup-face pcup-base-gold pf-front"></div>
                <div class="pcup-face pcup-base-gold pf-back"></div>
                <div class="pcup-face pcup-base-gold pf-left"></div>
                <div class="pcup-face pcup-base-gold pf-right"></div>
                <div class="pcup-face pcup-base-gold pf-top"></div>
              </div>

              <!-- Pedestal Base 1 -->
              <div class="pcup-base1">
                <div class="pcup-face pcup-dark-gold pf-front"></div>
                <div class="pcup-face pcup-dark-gold pf-back"></div>
                <div class="pcup-face pcup-dark-gold pf-left"></div>
                <div class="pcup-face pcup-dark-gold pf-right"></div>
                <div class="pcup-face pcup-dark-gold pf-top"></div>
                <div class="pcup-face pcup-dark-gold pf-bottom"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Typography & Text Animation -->
        <div class="preload-text-box">
          <div class="preload-pill-badge">
            <span class="mc-cube-icon"></span>
            <span>TAMIL MINECRAFT COMMUNITY</span>
          </div>

          <h1 class="preload-title">
            <span class="pt-glow">TMC</span> <span class="pt-white">AWARDS</span>
          </h1>

          <p class="preload-subtitle">
            தமிழ் மின்கிராஃப்ட் படைப்பாளர் விருதுகள்
          </p>

          <!-- Minecraft Pixel Progress Bar -->
          <div class="preload-bar-container">
            <div class="preload-bar-track">
              <div class="preload-bar-fill" id="preloadBarFill" style="width: 0%"></div>
            </div>
            <div class="preload-bar-meta">
              <span id="preloadStatusText" class="preload-status">Preparing Trophy Showcase...</span>
              <span id="preloadPercent" class="preload-pct">0%</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.prepend(el);
    this.overlay = el;
  }

  private startAnimation(): void {
    this.startTime = performance.now();
    this.isDismissed = false;

    const phrases = [
      { maxPct: 30, text: 'Crafting Trophy Showcase...', textTa: 'கோப்பை அரங்கம் உருவாகிறது...' },
      { maxPct: 65, text: 'Loading Verified Creators...', textTa: 'படைப்பாளர்கள் அரங்கம் தயாராகிறது...' },
      { maxPct: 90, text: 'Preparing Community Voting...', textTa: 'வாக்களிப்பு தயாராகிறது...' },
      { maxPct: 100, text: 'Welcome to TMC Awards!', textTa: 'TMC விருதுகளுக்கு நல்வரவு!' }
    ];

    const isTa = typeof window !== 'undefined' && 
      (window as any).lang && (window as any).lang() === 'ta';

    const frame = (now: number) => {
      if (this.isDismissed) return;

      const elapsed = now - this.startTime;
      const progress = Math.min(1, elapsed / this.duration);
      const easeProgress = this.easeOutCubic(progress);
      const pct = Math.floor(easeProgress * 100);

      if (this.progressBar) {
        this.progressBar.style.width = `${pct}%`;
      }
      if (this.progressPercent) {
        this.progressPercent.textContent = `${pct}%`;
      }
      if (this.overlay) {
        this.overlay.setAttribute('aria-valuenow', String(pct));
      }

      if (this.statusText) {
        const item = phrases.find(p => pct <= p.maxPct) || phrases[phrases.length - 1];
        this.statusText.textContent = isTa ? item.textTa : item.text;
      }

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(frame);
      } else {
        setTimeout(() => this.dismiss(), 200);
      }
    };

    this.animationFrameId = requestAnimationFrame(frame);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  public dismiss(): void {
    if (this.isDismissed) return;
    this.isDismissed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.overlay) {
      this.overlay.classList.add('preload-fade-out');
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.style.display = 'none';
        }
        // Trigger scroll reveals on page entry
        if (typeof window !== 'undefined' && (window as any).tmcScrollReveal) {
          (window as any).tmcScrollReveal.triggerInitial();
        }
      }, 550);
    }
  }

  public replay(): void {
    if (!this.overlay) {
      this.init();
      return;
    }
    this.overlay.style.display = 'flex';
    this.overlay.classList.remove('preload-fade-out');
    this.startAnimation();
  }
}

// Global initialization
declare global {
  interface Window {
    tmcPreloader?: TMCPreloader;
    replayPreload?: () => void;
  }
}

export function initPreloadAnimation(): TMCPreloader {
  const preloader = new TMCPreloader();
  if (typeof window !== 'undefined') {
    window.tmcPreloader = preloader;
    window.replayPreload = () => preloader.replay();
  }
  return preloader;
}

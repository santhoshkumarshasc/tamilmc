/**
 * TMC Awards - Preload Animation with Moving Trophy & "TWT - Tamil Minecraft Community" Text
 * Renders an animated Minecraft Championship Trophy Cup with moving levitation,
 * rotating golden aura, orbital sparks, pulsating spotlight, and custom TWT branding.
 */

export class TMCPreloader {
  private overlay: HTMLElement | null = null;
  private statusText: HTMLElement | null = null;
  private isDismissed: boolean = false;
  private timeoutId: number | null = null;
  private duration: number = 1900; // 1.9s cinematic entrance

  constructor() {
    this.init();
  }

  public init(): void {
    if (typeof document === 'undefined') return;

    this.overlay = document.getElementById('tmcPreloader');
    if (!this.overlay) {
      this.createOverlay();
    }

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
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'Loading TWT - Tamil Minecraft Community');

    el.innerHTML = `
      <div class="preload-backdrop"></div>
      
      <!-- Ambient Sparkle Motes -->
      <div class="preload-motes" aria-hidden="true">
        <span class="pm-spark s1">✦</span>
        <span class="pm-spark s2">★</span>
        <span class="pm-spark s3">✦</span>
        <span class="pm-spark s4">★</span>
        <span class="pm-spark s5">✦</span>
        <span class="pm-spark s6">✦</span>
      </div>

      <button type="button" class="preload-skip-btn" id="preloadSkipBtn" aria-label="Skip preload animation">
        <span>Skip</span>
        <span style="font-size:11px" aria-hidden="true">✕</span>
      </button>

      <div class="preload-content">
        <!-- 3D Moving Trophy Stage with Orbiting Energy Rings & Sparks -->
        <div class="preload-cup-stage" aria-label="TMC Golden Championship Trophy Cup Loading">
          <div class="preload-spotlight"></div>
          <div class="preload-cup-aura"></div>
          <div class="trophy-energy-ring r1" aria-hidden="true"></div>
          <div class="trophy-energy-ring r2" aria-hidden="true"></div>
          
          <!-- Orbiting Loading Sparks -->
          <div class="trophy-orbit-spark os1" aria-hidden="true">✦</div>
          <div class="trophy-orbit-spark os2" aria-hidden="true">★</div>
          <div class="trophy-orbit-spark os3" aria-hidden="true">✦</div>
          
          <div class="preload-cup-wrap trophy-moving-active">
            <div class="mc-cup-preload">
              <div class="cup-spark-preload cs1">✦</div>
              <div class="cup-spark-preload cs2">✦</div>

              <!-- Top Bowl -->
              <div class="pcup-bowl-main">
                <div class="pcup-face pcup-gold pf-front">
                  <div class="pcup-jewel" title="Emerald Gem"></div>
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

        <!-- Typography & Text Animation: TWT - Tamil Minecraft Community -->
        <div class="preload-text-box">
          <div class="preload-pill-badge">
            <span class="mc-cube-icon"></span>
            <span>OFFICIAL CREATOR SHOWCASE</span>
          </div>

          <h1 class="preload-title" id="preloadBrandHeader">
            <span class="twt-glow">TWT</span>
            <span class="twt-dash">-</span>
            <span class="twt-sub">Tamil Minecraft Community</span>
          </h1>

          <p class="preload-subtitle">
            தமிழ் மின்கிராஃப்ட் சமூகம் · TMC Awards
          </p>

          <!-- Dynamic Trophy Moving Loading Status (No progress bar) -->
          <div class="trophy-loading-label">
            <span class="loading-spin-star">✦</span>
            <span id="preloadStatusText">Loading Community Showcase...</span>
            <span class="loading-spin-star">✦</span>
          </div>
        </div>
      </div>
    `;

    document.body.prepend(el);
    this.overlay = el;
  }

  private startAnimation(): void {
    this.isDismissed = false;

    const phrases = [
      { delay: 0, text: 'Forging Championship Trophy...', textTa: 'தங்கக் கோப்பை தயாராகிறது...' },
      { delay: 600, text: 'Gathering Community Creators...', textTa: 'படைப்பாளர்கள் அரங்கம் உருவாகிறது...' },
      { delay: 1200, text: 'Connecting Tamil Minecraft Community...', textTa: 'TWT சமூகம் இணைகிறது...' },
      { delay: 1700, text: 'Welcome to TWT Showcase!', textTa: 'TWT அரங்கிற்கு நல்வரவு!' }
    ];

    const isTa = typeof window !== 'undefined' && 
      (window as any).lang && (window as any).lang() === 'ta';

    phrases.forEach(p => {
      window.setTimeout(() => {
        if (!this.isDismissed && this.statusText) {
          this.statusText.textContent = isTa ? p.textTa : p.text;
        }
      }, p.delay);
    });

    this.timeoutId = window.setTimeout(() => {
      this.dismiss();
    }, this.duration);
  }

  public dismiss(): void {
    if (this.isDismissed) return;
    this.isDismissed = true;

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
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

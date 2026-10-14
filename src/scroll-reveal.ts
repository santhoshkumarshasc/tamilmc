/**
 * TMC Awards - Scroll Animation & Reveal System
 * Modern high-performance scroll observer, staggered card entry,
 * and top glowing reading progress bar.
 */

import { ScrollRevealConfig } from './types.js';

export class TMCScrollReveal {
  private observer: IntersectionObserver | null = null;
  private config: ScrollRevealConfig;
  private progressBar: HTMLElement | null = null;

  constructor(config: ScrollRevealConfig = {}) {
    this.config = {
      threshold: config.threshold ?? 0.12,
      rootMargin: config.rootMargin ?? '0px 0px -40px 0px',
      staggerDelayMs: config.staggerDelayMs ?? 60
    };
    this.init();
  }

  public init(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    this.setupProgressBar();
    this.setupObserver();
    this.bindScrollEvents();
    this.observeAll();
  }

  private setupProgressBar(): void {
    let bar = document.getElementById('scrollProgressBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'scrollProgressBar';
      bar.className = 'scroll-progress-bar';
      document.body.prepend(bar);
    }
    this.progressBar = bar;
  }

  private bindScrollEvents(): void {
    const updateProgress = () => {
      if (!this.progressBar) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      this.progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
  }

  private setupObserver(): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback: reveal all
      document.querySelectorAll('.rv, .scroll-reveal, .pcard').forEach(el => {
        el.classList.add('in', 'revealed');
      });
      return;
    }

    const prefersReducedMotion = window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document.querySelectorAll('.rv, .scroll-reveal, .pcard').forEach(el => {
        el.classList.add('in', 'revealed');
      });
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.classList.add('in', 'revealed');
          
          // If this is a staggered parent container, trigger children
          const children = target.querySelectorAll<HTMLElement>('.stagger-child');
          children.forEach((child, i) => {
            child.style.transitionDelay = `${(i + 1) * (this.config.staggerDelayMs || 60)}ms`;
            child.classList.add('revealed');
          });

          this.observer?.unobserve(target);
        }
      });
    }, {
      threshold: this.config.threshold,
      rootMargin: this.config.rootMargin
    });
  }

  public observeAll(): void {
    if (!this.observer) return;
    const elements = document.querySelectorAll<HTMLElement>('.rv, .scroll-reveal, .pcard, .panel, .hero-grid > div');
    elements.forEach(el => {
      if (!el.classList.contains('in') && !el.classList.contains('revealed')) {
        this.observer?.observe(el);
      }
    });
  }

  public refresh(): void {
    this.observeAll();
  }

  public triggerInitial(): void {
    // Reveal top fold elements immediately
    const topElements = document.querySelectorAll<HTMLElement>('.hero .rv, .hero .scroll-reveal');
    topElements.forEach(el => {
      el.classList.add('in', 'revealed');
    });
    this.observeAll();
  }
}

declare global {
  interface Window {
    tmcScrollReveal?: TMCScrollReveal;
  }
}

export function initScrollReveal(config?: ScrollRevealConfig): TMCScrollReveal {
  const sr = new TMCScrollReveal(config);
  if (typeof window !== 'undefined') {
    window.tmcScrollReveal = sr;
  }
  return sr;
}

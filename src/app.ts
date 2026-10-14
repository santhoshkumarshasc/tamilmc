/**
 * TMC Awards - Main Showcase Application (TypeScript)
 * Controls creator grid, 1-vote voting logic, profile editor,
 * custom links, welcome certificate modal, preload animation,
 * and scroll reveals.
 */

import {
  CreatorProfile,
  Certificate,
  AuthSession,
  CustomLink
} from './types.js';
import { initPreloadAnimation } from './preload.js';
import { initScrollReveal } from './scroll-reveal.js';
import { initFx } from './fx.js';

const COLORS = ['#1f9d5e', '#1b8fd6', '#e0a81f', '#a855f7', '#f97316', '#ec4899', '#3358c4'];
const STYLE_CLASS: Record<string, string> = { raised: 's-glass', flat: 's-solid', outline: 's-neon' };

let session: AuthSession | null = null;
let myProfile: CreatorProfile | null = null;
let list: CreatorProfile[] = [];
let myLikes: Set<string> = new Set();
let myVoteId: string | null = null;
let myCerts: Certificate[] = [];
let q = '';
let selectedCategory = '';
let themeKey = 'emerald';
let currentCert: Certificate | null = null;
let authMode: 'in' | 'up' = 'in';
let editColor = '#1f9d5e';
let editAvatarImg = '';
let avatarMode: 'upload' | 'url' = 'upload';
let customLinks: CustomLink[] = [];
let verifiedCert: Certificate | null = null;
let claimedCert: Certificate | null = null;

// Persistent guest voter key
let voterKey = localStorage.getItem('tmc_voter_key');
if (!voterKey) {
  voterKey = 'voter-' + Math.random().toString(36).substring(2, 10);
  try { localStorage.setItem('tmc_voter_key', voterKey); } catch (e) {}
}

const $ = (id: string): HTMLElement | null => document.getElementById(id);
const esc = (s: any): string => (window as any).esc ? (window as any).esc(s) : String(s || '');
const safeUrl = (u?: string | null): string => (window as any).safeUrl ? (window as any).safeUrl(u) : (u || '');
const safeColor = (c?: string | null): string => (window as any).safeColor ? (window as any).safeColor(c) : '#1f7a45';
const onColor = (c?: string | null): string => (window as any).onColor ? (window as any).onColor(c) : '#ffffff';
const t = (k: string, vars?: any): string => (window as any).t ? (window as any).t(k, vars) : k;
const setMsg = (el: HTMLElement | null, text: string, cls: string): void => {
  if (el) (window as any).setMsg?.(el, text, cls);
};
const clearMsg = (el: HTMLElement | null): void => {
  if (el) (window as any).clearMsg?.(el);
};

/* ---------- PAGE NAVIGATION ---------- */
const PAGES = ['showcase', 'dashboard', 'redeem', '404'];

export function setPage(pageId: string): void {
  if (pageId === 'admin' || pageId === '#admin') {
    pageId = '404';
  }
  if (pageId === 'dashboard' && !session) {
    openAuth('in');
    pageId = 'showcase';
  }
  if (!PAGES.includes(pageId)) pageId = 'showcase';

  PAGES.forEach(p => {
    const el = $('page-' + p);
    if (el) el.classList.toggle('hide', p !== pageId);
    const navEl = document.querySelector(`.links [data-nav="${p}"]`);
    if (navEl) navEl.classList.toggle('active', p === pageId);
    const mNavEl = document.querySelector(`.mobile-drawer-links [data-nav="${p}"]`);
    if (mNavEl) mNavEl.classList.toggle('active', p === pageId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- AUTHENTICATION DIALOG & CONTROLS ---------- */
export function openAuth(mode: 'in' | 'up'): void {
  authMode = mode;
  authUi();
  clearMsg($('aMsg'));
  const aPass = $('aPass') as HTMLInputElement;
  const aPassConf = $('aPassConfirm') as HTMLInputElement;
  if (aPass) aPass.value = '';
  if (aPassConf) aPassConf.value = '';
  const hint = $('passMatchIndicator');
  if (hint) hint.classList.add('hide');

  const authDlg = $('authDlg') as HTMLDialogElement;
  if (authDlg) {
    if (typeof authDlg.showModal === 'function') authDlg.showModal();
    else authDlg.setAttribute('open', '');
  }
}

export function authUi(): void {
  const isUp = authMode === 'up';
  $('tabIn')?.setAttribute('aria-pressed', String(!isUp));
  $('tabUp')?.setAttribute('aria-pressed', String(isUp));
  
  const authTitle = $('authTitle');
  if (authTitle) authTitle.textContent = isUp ? t('auth.up') : t('auth.in');

  const aGo = $('aGo');
  if (aGo) aGo.textContent = isUp ? t('auth.up') : t('auth.in');

  const aPass = $('aPass') as HTMLInputElement;
  if (aPass) aPass.autocomplete = isUp ? 'new-password' : 'current-password';

  const aPassConfGroup = $('aPassConfirmGroup');
  if (aPassConfGroup) aPassConfGroup.classList.toggle('hide', !isUp);

  const aTermsGroup = $('aTermsGroup');
  if (aTermsGroup) aTermsGroup.classList.toggle('hide', !isUp);

  const hint = $('passMatchIndicator');
  if (hint) hint.classList.add('hide');
}

export function authBtns(): void {
  const signedIn = !!session;
  const authBtn = $('authBtn');
  if (authBtn) authBtn.textContent = signedIn ? t('auth.out') : t('auth.in');

  const mAuthBtn = $('mAuthBtn');
  if (mAuthBtn) mAuthBtn.textContent = signedIn ? t('auth.out') : t('auth.in');

  const heroJoin = $('heroJoin');
  if (heroJoin) heroJoin.textContent = signedIn ? t('hero.cta1b') : t('hero.cta1');

  const navDash = $('navDash');
  if (navDash) navDash.classList.toggle('hide', !signedIn);

  const mNavDash = $('mNavDash');
  if (mNavDash) mNavDash.classList.toggle('hide', !signedIn);

  const footNavDash = $('footNavDash');
  if (footNavDash) footNavDash.classList.toggle('hide', !signedIn);
}

function setupAuthPasswordControls(): void {
  const aPass = $('aPass') as HTMLInputElement;
  const aPassConf = $('aPassConfirm') as HTMLInputElement;
  const hint = $('passMatchIndicator');
  const toggleBtn = $('togglePassVis');

  const checkMatch = () => {
    if (authMode !== 'up' || !hint) {
      if (hint) hint.classList.add('hide');
      return;
    }
    const p1 = aPass?.value || '';
    const p2 = aPassConf?.value || '';
    if (!p2) {
      hint.classList.add('hide');
      return;
    }
    hint.classList.remove('hide');
    if (p1 === p2) {
      hint.className = 'pass-hint match';
      hint.textContent = t('a.pass_match') || '✓ Passwords match';
    } else {
      hint.className = 'pass-hint mismatch';
      hint.textContent = t('a.pass_mismatch_live') || '✕ Passwords do not match';
    }
  };

  aPass?.addEventListener('input', checkMatch);
  aPassConf?.addEventListener('input', checkMatch);

  if (toggleBtn) {
    toggleBtn.onclick = () => {
      const isPass = aPass.type === 'password';
      aPass.type = isPass ? 'text' : 'password';
      if (aPassConf) aPassConf.type = isPass ? 'text' : 'password';
      toggleBtn.textContent = isPass ? t('a.hide_pass') : t('a.show_pass');
    };
  }
}

/* ---------- THEME MANAGEMENT (DARK / LIGHT) ---------- */
function getPreferredTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem('tmc_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(th: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', th);
  try { localStorage.setItem('tmc_theme', th); } catch (e) {}
  const pill = $('themePillLabel');
  if (pill) pill.textContent = th === 'dark' ? 'Dark mode' : 'Light mode';
}

function toggleTheme(): void {
  const curr = document.documentElement.getAttribute('data-theme') || 'light';
  const next = curr === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

/* ---------- MOBILE HAMBURGER MENU & DRAWER ---------- */
function toggleMobileMenu(open?: boolean): void {
  const burger = $('hamburgerBtn');
  const drawer = $('mobileDrawer');
  const backdrop = $('mobileBackdrop');
  const isOpen = open !== undefined ? open : drawer?.classList.contains('open');

  if (isOpen) {
    burger?.classList.remove('active');
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
    drawer?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  } else {
    burger?.classList.add('active');
    drawer?.classList.add('open');
    backdrop?.classList.add('open');
    burger?.setAttribute('aria-expanded', 'true');
    drawer?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

/* ---------- SERVER ICON LOADER ---------- */
async function loadServerIcon(): Promise<void> {
  const { data } = await (window as any).sb.rpc('get_server_icon');
  const defaultSvg = `<svg viewBox="0 0 8 8" aria-hidden="true"><rect width="8" height="8" rx="1.2" fill="#1f7a45"/><g fill="#3dffa0"><rect x="1" y="1" width="2" height="2"/><rect x="5" y="1" width="2" height="2"/><rect x="3" y="3" width="2" height="2"/><rect x="1" y="5" width="2" height="2"/><rect x="5" y="5" width="2" height="2"/></g></svg>`;

  ['serverIconSlot', 'serverIconSlotDrawer'].forEach(slotId => {
    const slot = $(slotId);
    if (!slot) return;
    if (data && typeof data === 'string') {
      slot.innerHTML = `<img src="${esc(data)}" alt="TMC Logo" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`;
    } else {
      slot.innerHTML = defaultSvg;
    }
  });
}

/* ---------- SVG LOGOS FOR SOCIAL MEDIA LINKS ---------- */
function getSocialIconSvg(platform: string, size = 18): string {
  switch (platform) {
    case 'yt':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
    case 'discord':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`;
    case 'insta':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
    case 'twitch':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>`;
    case 'x':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
    default:
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
  }
}

/* ---------- CREATOR SHOWCASE RENDERING ---------- */
export function renderList(): void {
  const grid = $('grid');
  if (!grid) return;

  const filtered = list.filter(p => {
    if (selectedCategory && (p as any).category !== selectedCategory) return true;
    if (!q) return true;
    const term = q.toLowerCase();
    return p.display_name.toLowerCase().includes(term) ||
      p.channel_name.toLowerCase().includes(term) ||
      p.handle.toLowerCase().includes(term) ||
      (p.bio && p.bio.toLowerCase().includes(term));
  });

  const sCreators = $('sCreators');
  if (sCreators) sCreators.textContent = String(list.length);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state glass"><p>${esc(t('empty.grid'))}</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map((p, idx) => {
    const isVoted = myVoteId === p.id;
    const hasCustomImg = !!p.avatar_image || !!p.avatar_url;
    const avatarSrc = p.avatar_image || p.avatar_url;
    const initialLetter = (p.display_name || p.handle || 'C').charAt(0).toUpperCase();

    const avatarHtml = hasCustomImg
      ? `<img class="card-avatar-img" src="${esc(avatarSrc)}" alt="${esc(p.display_name)}'s avatar" loading="lazy">`
      : `<div class="card-avatar-initial" style="background:${safeColor(p.accent)};color:${onColor(p.accent)}">${esc(initialLetter)}</div>`;

    return `
      <div class="pcard ${STYLE_CLASS[p.card_style] || 's-glass'} ${isVoted ? 'voted-active-card' : ''} rv" data-id="${esc(p.id)}" style="--card-accent:${safeColor(p.accent)};animation-delay:${idx * 0.05}s">
        <div class="card-top">
          <div class="card-avatar-wrap">
            ${avatarHtml}
          </div>
          <div class="card-meta">
            <h3 class="card-name">${esc(p.display_name)}</h3>
            <div class="card-handle">@${esc(p.handle)}</div>
          </div>
        </div>

        <p class="card-bio">${esc(p.bio || 'Tamil Minecraft Creator')}</p>

        <div class="card-stats-row">
          <span class="card-stat-pill">❤️ <b>${p.likes || 0}</b></span>
          <span class="card-stat-pill ${isVoted ? 'voted-stat' : ''}">🗳️ <b>${p.votes || 0}</b> ${esc(t('vote.count'))}</span>
          ${p.cert_count ? `<span class="card-stat-pill cert-pill">🎓 <b>${p.cert_count}</b> certs</span>` : ''}
        </div>

        <div class="card-actions">
          <button type="button" class="btn primary small card-vote-btn ${isVoted ? 'voted' : ''}" onclick="window.voteCreator('${esc(p.id)}')">
            ${isVoted ? '✓ ' + esc(t('vote.voted_pill')) : '🗳️ ' + esc(t('vote.btn'))}
          </button>
          <button type="button" class="btn small" onclick="window.openProfile('${esc(p.handle)}')">
            Profile →
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (typeof window !== 'undefined' && (window as any).tmcScrollReveal) {
    (window as any).tmcScrollReveal.refresh();
  }
}

/* ---------- 1 PERSON = 1 VOTE SYSTEM ---------- */
export async function voteCreator(id: string): Promise<void> {
  const { data, error } = await (window as any).sb.rpc('vote_best_creator', {
    p_profile: id,
    p_voter_id: session ? session.user.id : voterKey
  });

  if (error) {
    alert('Voting error: ' + error.message);
    return;
  }

  if (data.voted) {
    myVoteId = data.votedId;
    const target = list.find(x => x.id === id);
    if (target) target.votes = data.votes;

    if (data.prevVoteId && data.prevVoteId !== id) {
      const prev = list.find(x => x.id === data.prevVoteId);
      if (prev) prev.votes = data.oldVotes;
    }

    if ((window as any).confetti) (window as any).confetti();
  } else {
    myVoteId = null;
    const target = list.find(x => x.id === id);
    if (target) target.votes = data.votes;
  }

  renderList();
  updatePollBanner();
}

function updatePollBanner(): void {
  const votedTitle = $('myVotedTitle');
  if (!votedTitle) return;

  if (myVoteId) {
    const prof = list.find(x => x.id === myVoteId);
    votedTitle.textContent = prof ? `${t('vote.your_vote', { name: prof.display_name })}` : '1 Vote Active';
  } else {
    votedTitle.textContent = t('vote.sub') || 'Cast your vote for the best Tamil Minecraft creator!';
  }
}

/* ---------- CUSTOM PROFILE LINKS CONTROLS ---------- */
export function setupCustomLinksControls(): void {
  const addBtn = $('btnAddCustomLink');
  const listEl = $('customLinksList');
  if (!addBtn || !listEl) return;

  const renderInputs = () => {
    listEl.innerHTML = customLinks.map((link, idx) => `
      <div class="custom-link-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
        <input type="text" placeholder="Title (e.g. SMP Server)" value="${esc(link.title)}" oninput="window.updateCustomLink(${idx}, 'title', this.value)" style="flex:1">
        <input type="url" placeholder="https://..." value="${esc(link.url)}" oninput="window.updateCustomLink(${idx}, 'url', this.value)" style="flex:2">
        <button type="button" class="btn small danger" onclick="window.removeCustomLink(${idx})">✕</button>
      </div>
    `).join('');
  };

  addBtn.onclick = () => {
    customLinks.push({ id: 'cl-' + Date.now(), title: '', url: '', platform: 'custom' });
    renderInputs();
  };

  (window as any).updateCustomLink = (idx: number, field: 'title' | 'url', val: string) => {
    if (customLinks[idx]) customLinks[idx][field] = val;
  };

  (window as any).removeCustomLink = (idx: number) => {
    customLinks.splice(idx, 1);
    renderInputs();
  };
}

/* ---------- WELCOME CERTIFICATE POPUP MODAL ---------- */
export function setupWelcomeCertModal(): void {
  const dlg = $('welcomeCertDlg') as HTMLDialogElement;
  const closeBtn = $('welcomeCertClose');
  const closeBtn2 = $('btnCloseWelcomeModal');
  const dlBtn = $('btnDlWelcomeCert');
  const copyBtn = $('btnCopyWelcomeCode');

  const closeDlg = () => {
    if (dlg) {
      if (typeof dlg.close === 'function') dlg.close();
      else dlg.removeAttribute('open');
    }
  };

  if (closeBtn) closeBtn.onclick = closeDlg;
  if (closeBtn2) closeBtn2.onclick = closeDlg;

  if (dlBtn) {
    dlBtn.onclick = () => {
      const cv = $('welcomeCertCanvas') as HTMLCanvasElement;
      if (cv && (window as any).downloadCanvas) {
        (window as any).downloadCanvas(cv, 'TMC-Welcome-Certificate.png');
      }
    };
  }

  if (copyBtn) {
    copyBtn.onclick = () => {
      const code = $('welcomeCertCode')?.textContent || '';
      navigator.clipboard.writeText(code).then(() => {
        alert(t('cert.code_copied') || 'Copied!');
      });
    };
  }
}

/* ---------- INITIAL DATA LOAD ---------- */
async function loadData(): Promise<void> {
  const { data: profs } = await (window as any).sb.from('public_profiles').select('*').order('votes', { ascending: false }).limit(500);
  list = profs || [];

  const { data: vote } = await (window as any).sb.rpc('get_my_vote', {
    p_voter_id: session ? session.user.id : voterKey
  });
  myVoteId = vote || null;

  renderList();
  updatePollBanner();
  await loadServerIcon();
}

// Global window actions
declare global {
  interface Window {
    voteCreator: typeof voteCreator;
    openProfile: (handle: string) => void;
    setPage: typeof setPage;
  }
}

window.voteCreator = voteCreator;

window.openProfile = (handle: string) => {
  const p = list.find(x => x.handle === handle);
  if (!p) return;
  const dlg = $('profDlg') as HTMLDialogElement;
  const body = $('profBody');
  if (!dlg || !body) return;

  const socialLinksHtml = Object.entries(p.socials || {})
    .filter(([_, url]) => !!url)
    .map(([plat, url]) => `<a class="btn small" href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${getSocialIconSvg(plat)} ${esc(plat.toUpperCase())}</a>`)
    .join('');

  const customLinksHtml = (p.custom_links || [])
    .map(cl => `<a class="btn small" href="${esc(safeUrl(cl.url))}" target="_blank" rel="noopener noreferrer">🔗 ${esc(cl.title)}</a>`)
    .join('');

  body.innerHTML = `
    <div class="dlg-head">
      <h2>${esc(p.display_name)}</h2>
      <button class="icon-btn" onclick="document.getElementById('profDlg').close()">✕</button>
    </div>
    <div style="padding:16px 20px">
      <div style="color:var(--muted);font-weight:700;margin-bottom:8px">@${esc(p.handle)} • ${esc(p.channel_name)}</div>
      <p style="margin-bottom:16px;line-height:1.6">${esc(p.bio || 'Creator profile')}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${socialLinksHtml}
        ${customLinksHtml}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line-subtle);padding-top:14px">
        <span>❤️ ${p.likes || 0} • 🗳️ ${p.votes || 0} votes</span>
        <button class="btn primary" onclick="window.voteCreator('${esc(p.id)}')">🗳️ Vote for ${esc(p.display_name)}</button>
      </div>
    </div>
  `;

  if (typeof dlg.showModal === 'function') dlg.showModal();
  else dlg.setAttribute('open', '');
};

/* ---------- INITIALIZATION HOOK ---------- */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    // 1. Preload Animation with Cup & Text
    initPreloadAnimation();

    // 2. Scroll reveal animations
    initScrollReveal();

    // 3. Visual & sound fx
    initFx();

    // 4. Custom links & modals
    setupCustomLinksControls();
    setupWelcomeCertModal();
    setupAuthPasswordControls();

    // 5. Load data
    await loadData();

    // 6. Search input binding
    const searchInp = $('searchInp') as HTMLInputElement;
    if (searchInp) {
      searchInp.oninput = (e) => {
        q = (e.target as HTMLInputElement).value;
        renderList();
      };
    }

    // 7. Nav buttons
    $('authBtn')?.addEventListener('click', async () => {
      if (session) {
        await (window as any).sb.auth.signOut();
        session = null;
        authBtns();
        setPage('showcase');
      } else {
        openAuth('in');
      }
    });

    $('mAuthBtn')?.addEventListener('click', async () => {
      toggleMobileMenu(false);
      if (session) {
        await (window as any).sb.auth.signOut();
        session = null;
        authBtns();
        setPage('showcase');
      } else {
        openAuth('in');
      }
    });

    $('heroJoin')?.addEventListener('click', () => {
      if (session) setPage('dashboard');
      else openAuth('up');
    });

    // 8. Hamburger & mobile menu
    const burger = $('hamburgerBtn');
    if (burger) {
      burger.onclick = () => toggleMobileMenu();
    }
    const backdrop = $('mobileBackdrop');
    if (backdrop) {
      backdrop.onclick = () => toggleMobileMenu(false);
    }

    // 9. Listen for DB updates (e.g. from admin reset)
    window.addEventListener('tmc:dbchange', async () => {
      await loadData();
    });
  });
}

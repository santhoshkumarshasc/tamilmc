(function(){
'use strict';
const COLORS=['#1f9d5e','#1b8fd6','#e0a81f','#a855f7','#f97316','#ec4899','#3358c4'];
const STYLE_CLASS={raised:'s-glass',flat:'s-solid',outline:'s-neon'};

function getStoredSession(){
  try {
    const raw = localStorage.getItem('tmc_auth_session');
    if(raw) return JSON.parse(raw);
    const dbRaw = localStorage.getItem('tmc_live_db_v3');
    if(dbRaw) {
      const parsed = JSON.parse(dbRaw);
      if(parsed && parsed.session) return parsed.session;
    }
  } catch(e){}
  return null;
}

let session=getStoredSession(),myProfile=null,list=[],myLikes=new Set(),myVoteId=null,myCerts=[],q='',themeKey='emerald',current=null,authMode='in';
let editColor='#1f9d5e',editAvatarImg='',avatarMode='upload';
let verifiedCert=null,claimedCert=null;
let customLinks=[];

// Generate persistent voter token for guest voting if not logged in
let voterKey=localStorage.getItem('tmc_voter_key');
if(!voterKey){
  voterKey='voter-'+Math.random().toString(36).substring(2,10);
  try{localStorage.setItem('tmc_voter_key',voterKey)}catch(e){}
}

/* ---------- PAGE NAVIGATION ---------- */
const PAGES=['showcase','dashboard','redeem','404'];
function setPage(pageId){
  if(pageId==='admin'||pageId==='#admin'){
    pageId='404';
  }
  if(pageId==='dashboard'&&!session){
    openAuth();
    pageId='showcase';
  }
  if(!PAGES.includes(pageId)) pageId='showcase';
  PAGES.forEach(p=>{
    const el=$('page-'+p);
    if(el) el.classList.toggle('hide',p!==pageId);
    const navEl=document.querySelector(`.links [data-nav="${p}"]`);
    if(navEl) navEl.classList.toggle('active',p===pageId);
    const mNavEl=document.querySelector(`.mobile-drawer-links [data-nav="${p}"]`);
    if(mNavEl) mNavEl.classList.toggle('active',p===pageId);
  });
  window.scrollTo({top:0,behavior:'smooth'});
}

// Nav links (desktop & logo)
document.querySelectorAll('.links a[data-nav], .logo[data-nav]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const p=a.dataset.nav;
    location.hash='#'+p;
    setPage(p);
  });
});

// Mobile drawer navigation links
document.querySelectorAll('.mobile-nav-link').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const p=a.dataset.nav;
    location.hash='#'+p;
    setPage(p);
    toggleMobileMenu(false);
  });
});

if($('browseBtn')){
  $('browseBtn').addEventListener('click',e=>{
    e.preventDefault();
    setPage('showcase');
    $('showcase-grid').scrollIntoView({behavior:'smooth'});
  });
}

window.addEventListener('hashchange',()=>{
  const hash=(location.hash||'').split('?')[0].replace('#','');
  if(hash==='admin'||hash==='#admin'){
    setPage('404');
    return;
  }
  if(PAGES.includes(hash)) setPage(hash);
  else setPage('showcase');
});

/* ---------- THEME MANAGEMENT (DARK / LIGHT) ---------- */
function getPreferredTheme(){
  const saved=localStorage.getItem('tmc_theme');
  if(saved==='dark'||saved==='light') return saved;
  return 'light';
}
function applyTheme(th){
  document.documentElement.setAttribute('data-theme', th);
  try{localStorage.setItem('tmc_theme', th)}catch(e){}
  const pill=$('themePillLabel');
  if(pill) pill.textContent = th==='dark'?'Dark mode':'Light mode';
}
function toggleTheme(){
  const curr=document.documentElement.getAttribute('data-theme')||'light';
  const next=curr==='dark'?'light':'dark';
  applyTheme(next);
}
if($('themeBtn')) $('themeBtn').onclick=toggleTheme;
if($('mThemeBtn')) $('mThemeBtn').onclick=toggleTheme;
applyTheme(getPreferredTheme());

/* ---------- MOBILE HAMBURGER MENU & DRAWER ---------- */
function toggleMobileMenu(force){
  const drawer=$('mobileNav'), btn=$('navToggle');
  if(!drawer||!btn) return;
  const isOpening = (typeof force==='boolean') ? force : drawer.classList.contains('hide');
  drawer.classList.toggle('hide', !isOpening);
  btn.classList.toggle('active', isOpening);
  btn.setAttribute('aria-expanded', isOpening?'true':'false');
  document.body.style.overflow = isOpening ? 'hidden' : '';
}
if($('navToggle')) $('navToggle').onclick=()=>toggleMobileMenu();
if($('mobileNavClose')) $('mobileNavClose').onclick=()=>toggleMobileMenu(false);
if($('mobileNavBackdrop')) $('mobileNavBackdrop').onclick=()=>toggleMobileMenu(false);

if($('mLangBtn')) $('mLangBtn').onclick=()=>{
  if($('langBtn')) $('langBtn').click();
  const curLang=(typeof lang==='function')?lang():'en';
  if($('mLangVal')) $('mLangVal').textContent=curLang==='ta'?'தமிழ்':'English';
};

if($('mAuthBtn')) $('mAuthBtn').onclick=()=>{
  toggleMobileMenu(false);
  if($('authBtn')) $('authBtn').click();
};

/* ---------- SERVER ICON REPLACEMENT ---------- */
async function loadServerIcon(){
  const {data}=await sb.rpc('get_server_icon');
  applyServerIcon(data);
}
function applyServerIcon(iconUrl){
  const slot=$('navIconSlot');
  if(iconUrl){
    if(slot) slot.innerHTML=`<img src="${esc(iconUrl)}" class="nav-server-icon" alt="TMC Logo">`;
  } else {
    const defaultSvg=`<svg viewBox="0 0 8 8" aria-hidden="true"><rect width="8" height="8" rx="1.2" fill="#1f7a45"/><g fill="#3dffa0"><rect x="1" y="1" width="2" height="2"/><rect x="5" y="1" width="2" height="2"/><rect x="3" y="3" width="2" height="2"/><rect x="1" y="5" width="2" height="2"/><rect x="5" y="5" width="2" height="2"/></g></svg>`;
    if(slot) slot.innerHTML=defaultSvg;
  }
}

/* ---------- BRAND SOCIAL LOGOS (ACCURATE & OFFICIAL) ---------- */
const BRAND_LOGOS = {
  yt: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#FF0000" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  discord: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#5865F2" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
  insta: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#E1306C" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
  twitch: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#9146FF" aria-hidden="true"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>`,
  x: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  reddit: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#FF4500" aria-hidden="true"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.56 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`,
  telegram: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#229ED9" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.534-.195 1.006.128.832.932z"/></svg>`,
  store: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#e0a81f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  web: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
};

function detectPlatform(url, chosen){
  if(chosen&&chosen!=='auto'&&BRAND_LOGOS[chosen]) return chosen;
  if(!url) return 'web';
  const u=url.toLowerCase();
  if(u.includes('youtube.com')||u.includes('youtu.be')) return 'yt';
  if(u.includes('discord.gg')||u.includes('discord.com')) return 'discord';
  if(u.includes('instagram.com')) return 'insta';
  if(u.includes('twitch.tv')) return 'twitch';
  if(u.includes('twitter.com')||u.includes('x.com')) return 'x';
  if(u.includes('facebook.com')||u.includes('fb.watch')) return 'facebook';
  if(u.includes('tiktok.com')) return 'tiktok';
  if(u.includes('reddit.com')) return 'reddit';
  if(u.includes('github.com')) return 'github';
  if(u.includes('t.me')||u.includes('telegram.me')) return 'telegram';
  if(u.includes('store')||u.includes('shop')||u.includes('merch')||u.includes('teespring')) return 'store';
  return 'web';
}

/* ---------- SHOWCASE & VOTING ---------- */
function renderAvatarHtml(p){
  if(p.avatar_image||p.avatar_url){
    return `<img src="${esc(p.avatar_image||p.avatar_url)}" alt="${esc(p.channel_name||p.display_name||'Creator')}">`;
  }
  const initials=((p.channel_name||p.display_name||'M').trim()[0]||'M').toUpperCase();
  return `<span class="avatar-initial" style="background:${safeColor(p.accent||'#1f9d5e')}">${esc(initials)}</span>`;
}

function renderSocialsHtml(socials, customLinksList){
  const badges=[];
  if(socials){
    if(socials.yt) badges.push(`<a class="social-pill sp-yt" href="${esc(socials.yt)}" target="_blank" rel="noopener noreferrer">${BRAND_LOGOS.yt}<span>YouTube</span></a>`);
    if(socials.discord) badges.push(`<a class="social-pill sp-discord" href="${esc(socials.discord)}" target="_blank" rel="noopener noreferrer">${BRAND_LOGOS.discord}<span>Discord</span></a>`);
    if(socials.insta) badges.push(`<a class="social-pill sp-insta" href="${esc(socials.insta)}" target="_blank" rel="noopener noreferrer">${BRAND_LOGOS.insta}<span>Instagram</span></a>`);
    if(socials.twitch) badges.push(`<a class="social-pill sp-twitch" href="${esc(socials.twitch)}" target="_blank" rel="noopener noreferrer">${BRAND_LOGOS.twitch}<span>Twitch</span></a>`);
    if(socials.x) badges.push(`<a class="social-pill sp-x" href="${esc(socials.x)}" target="_blank" rel="noopener noreferrer">${BRAND_LOGOS.x}<span>X</span></a>`);
  }
  if(Array.isArray(customLinksList)){
    customLinksList.forEach(cl=>{
      if(!cl||!cl.url) return;
      const plat=detectPlatform(cl.url, cl.platform);
      const icon=BRAND_LOGOS[plat]||BRAND_LOGOS.web;
      badges.push(`<a class="social-pill sp-${plat}" href="${esc(cl.url)}" target="_blank" rel="noopener noreferrer">${icon}<span>${esc(cl.title||cl.url.replace(/^https?:\/\//,'').slice(0,22))}</span></a>`);
    });
  }
  return badges.length ? `<div class="social-chips">${badges.join('')}</div>` : '';
}

function cardHtml(p,opts){
  opts=opts||{};
  const ac=safeColor(p.accent),on=onColor(ac),sc=STYLE_CLASS[p.card_style]||'s-glass';
  const liked=myLikes.has(p.id);
  const isVoted=(myVoteId===p.id);
  const votes=p.votes||0;

  return `<article class="pcard ${sc}" style="--ac:${ac};--on-ac:${on}" ${opts.preview?'':`data-tilt data-open="${esc(p.handle)}" tabindex="0" role="button" aria-label="${esc(p.channel_name)}"`}>
    <div class="card-top">
      <div class="avatar" aria-hidden="true">${renderAvatarHtml(p)}</div>
      <div>
        <h3>${esc(p.channel_name)}</h3>
        <div class="by">${t('p.by')} ${esc(p.display_name)}</div>
      </div>
    </div>
    
    <div class="tags">
      ${p.cert_count>0?`<span class="tag">${t('p.cert')}</span>`:''}
      ${votes>0?`<span class="tag" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a">★ ${votes} ${t('vote.count')}</span>`:''}
    </div>

    <p>${esc(p.bio||'')}</p>
    ${renderSocialsHtml(p.socials, p.custom_links)}

    <div class="card-foot">
      ${opts.preview ? `<span class="by">♡ ${p.likes||0} · ★ ${votes}</span>` : `
        <button class="vote-btn ${isVoted?'voted':''}" data-vote="${esc(p.id)}" title="Vote for Best Creator (1 vote per visitor limit)">
          ${isVoted ? `★ ${t('vote.voted_pill')}` : t('vote.btn')} (${votes})
        </button>
        <button class="like" data-like="${esc(p.id)}" aria-pressed="${liked}" aria-label="Like">
          ${liked?'♥':'♡'} ${p.likes||0}
        </button>
      `}
    </div>
  </article>`;
}

function updateVotingLeader(){
  if(!list.length){
    $('voteLeaderName').textContent='-';
    $('voteLeaderCount').textContent='0 votes';
    updateVoteBannerStatus();
    return;
  }
  const sorted=[...list].sort((a,b)=>(b.votes||0)-(a.votes||0));
  const top=sorted[0];
  if(top&&(top.votes||0)>0){
    $('voteLeaderName').textContent=top.channel_name;
    $('voteLeaderCount').textContent=`${top.votes} ${t('vote.count')}`;
  } else {
    $('voteLeaderName').textContent='Be the first to vote!';
    $('voteLeaderCount').textContent='0 votes';
  }
  updateVoteBannerStatus();
}

function updateVoteBannerStatus(){
  const label=$('voteRuleLabel');
  if(!label) return;
  if(myVoteId && list.length){
    const votedCreator=list.find(x=>x.id===myVoteId);
    if(votedCreator){
      label.innerHTML=`✓ ${t('vote.your_vote',{name:`<b style="color:var(--text);font-weight:800">${esc(votedCreator.channel_name)}</b>`})} <span style="opacity:0.8;font-weight:400;margin-left:6px">(${t('vote.limit_hint')})</span>`;
      return;
    }
  }
  label.textContent=t('vote.limit_hint');
}

function renderGrid(){
  const rows=list.filter(p=>(p.display_name+' '+p.channel_name+' '+(p.bio||'')).toLowerCase().includes(q));
  $('grid').innerHTML=rows.length?rows.map(p=>cardHtml(p).replace('<article class="pcard','<article class="rv pcard')).join(''):`<div class="empty glass" style="grid-column:1/-1">${t('empty.grid')}</div>`;
  
  $('grid').querySelectorAll('[data-open]').forEach(el=>{
    const open=()=>openProfile(el.dataset.open);
    el.onclick=e=>{if(e.target.closest('[data-like]')||e.target.closest('[data-vote]'))return;open()};
    el.onkeydown=e=>{if(e.key==='Enter'&&!e.target.closest('[data-like]')&&!e.target.closest('[data-vote]'))open()};
  });
  
  $('grid').querySelectorAll('[data-like]').forEach(b=>b.onclick=e=>{e.stopPropagation();like(b.dataset.like)});
  $('grid').querySelectorAll('[data-vote]').forEach(b=>b.onclick=e=>{e.stopPropagation();voteCreator(b.dataset.vote)});
  
  fx.reveal($('grid'));
  fx.countUp($('sCreators'),list.length);
  fx.countUp($('sCerts'),list.reduce((n,p)=>n+(p.cert_count||0),0));
  updateVotingLeader();
}
$('search').oninput=e=>{q=e.target.value.trim().toLowerCase();renderGrid()};

async function loadAnnouncement(){
  try {
    const {data}=await sb.rpc('get_active_announcement');
    const banner=$('announcementBanner');
    if(!banner) return;
    if(!data || !data.is_active){
      banner.classList.add('hide');
      banner.innerHTML='';
      return;
    }
    const color=data.badge_color||'emerald';
    const actionBtn=data.link_url?`<a href="${esc(data.link_url)}" class="btn small primary" style="flex:none;white-space:nowrap;padding:7px 14px;font-size:12px;">${esc(data.link_text||'View →')}</a>`:'';
    banner.innerHTML=`
      <div class="announcement-card glass" style="padding:12px 18px;border-radius:14px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border:1.5px solid var(--line);box-shadow:var(--neu-shadow-sm);">
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:240px;">
          <span style="font-size:11px;font-weight:800;letter-spacing:0.06em;padding:4px 10px;border-radius:9999px;background:var(--em-soft);color:var(--em);border:1px solid rgba(34,197,94,0.3);flex:none;">
            ${esc(data.badge||'📢 ANNOUNCEMENT')}
          </span>
          <div style="flex:1;">
            <b style="font-size:14px;color:var(--text);display:block;margin-bottom:2px;">${esc(data.title)}</b>
            <span style="font-size:13px;color:var(--muted);line-height:1.4;display:block;">${esc(data.message)}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex:none;">
          ${actionBtn}
          <button type="button" class="icon-btn" id="btnCloseAnn" aria-label="Dismiss" style="font-size:13px;width:26px;height:26px;border-radius:8px;cursor:pointer;">✕</button>
        </div>
      </div>
    `;
    banner.classList.remove('hide');
    const btnClose=$('btnCloseAnn');
    if(btnClose) btnClose.onclick=()=>{ banner.classList.add('hide'); };
  } catch(e){}
}

async function loadPublic(){
  const {data,error}=await sb.from('public_profiles').select('*').order('likes',{ascending:false}).limit(500);
  list=error?[]:data;
  renderGrid();
  loadAnnouncement();
}
async function like(id){
  if(!session)return openAuth();
  const {data,error}=await sb.rpc('toggle_like',{p_profile:id});
  if(error)return;
  const p=list.find(x=>x.id===id);if(p)p.likes=data.likes;
  data.liked?myLikes.add(id):myLikes.delete(id);renderGrid();
  const b=document.querySelector(`[data-like="${CSS.escape(id)}"]`);if(b)b.classList.add('pop');
}

/* Strictly 1 Person = 1 Vote system */
async function voteCreator(id){
  const voterId=session?session.user.id:voterKey;
  const {data,error}=await sb.rpc('vote_best_creator',{p_profile:id,p_voter_id:voterId});
  if(error)return;

  // If user previously voted for a different creator, update old creator's vote count
  if(data.prevVoteId && data.prevVoteId !== id){
    const oldP=list.find(x=>x.id===data.prevVoteId);
    if(oldP) oldP.votes=(data.oldVotes!==undefined)?data.oldVotes:Math.max(0,(oldP.votes||1)-1);
  }

  const p=list.find(x=>x.id===id);
  if(p) p.votes=data.votes;
  myVoteId=data.voted?data.votedId:null;

  if(data.voted){
    fx.confetti();
  }
  updateVotingLeader();
  renderGrid();
}
async function loadMyVote(){
  const voterId=session?session.user.id:voterKey;
  const {data}=await sb.rpc('get_my_vote',{p_voter_id:voterId});
  myVoteId=data||null;
  updateVotingLeader();
}

function openProfile(handle){
  const p=list.find(x=>x.handle===handle);if(!p)return;
  const ch=safeUrl(p.channel_url)?`<a class="btn primary small" href="${esc(safeUrl(p.channel_url))}" target="_blank" rel="noopener noreferrer nofollow">${t('p.visit')}</a>`:'';
  $('profBody').innerHTML=`<div class="dlg-head"><h2>@${esc(p.handle)}</h2><button class="icon-btn" id="profClose" aria-label="Close">✕</button></div>
    ${cardHtml(p,{preview:true})}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">${ch}</div>`;
  $('profClose').onclick=()=>$('profDlg').close();
  $('profDlg').showModal();
}

/* ---------- DISCORD ONLY AUTHENTICATION ---------- */
function openAuth(){
  clearMsg($('aMsg'));
  connectedDiscordUser = null;
  discordDmCodeSent = false;
  discordDmCodeVerified = false;
  currentDmCode = '';
  if($('discordConnectedState')) $('discordConnectedState').classList.add('hide');
  if($('discordInputState')) $('discordInputState').classList.remove('hide');
  if($('discordDmNotice')) $('discordDmNotice').classList.add('hide');
  if($('discordCodeVerifyGroup')) $('discordCodeVerifyGroup').classList.add('hide');
  if($('aConfirmCode')) $('aConfirmCode').value = '';
  if($('aDiscordUser')) $('aDiscordUser').value = '';
  if($('discordCodeStatus')) $('discordCodeStatus').classList.add('hide');
  $('authDlg').showModal();
}

function authUi(){}

function authBtns(){
  const signedIn = !!session;
  const dcName = session?.user?.discord_username || session?.user?.name;
  
  const authLabel = $('authBtnLabel');
  if(authLabel){
    authLabel.textContent = signedIn ? (dcName ? `@${dcName} • ${t('auth.out')}` : t('auth.out')) : t('auth.in');
  } else {
    $('authBtn').textContent = signedIn ? t('auth.out') : t('auth.in');
  }
  
  const mAuthLabel = $('mAuthBtnLabel');
  if(mAuthLabel){
    mAuthLabel.textContent = signedIn ? (dcName ? `@${dcName} • ${t('auth.out')}` : t('auth.out')) : t('auth.in');
  } else if($('mAuthBtn')){
    $('mAuthBtn').textContent = signedIn ? t('auth.out') : t('auth.in');
  }

  $('heroJoin').textContent = signedIn ? t('hero.cta1b') : t('hero.cta1');
  if($('navDash')){
    if(signedIn) $('navDash').classList.remove('hide');
    else $('navDash').classList.add('hide');
  }
  if($('mNavDash')){
    if(signedIn) $('mNavDash').classList.remove('hide');
    else $('mNavDash').classList.add('hide');
  }
  if($('footNavDash')){
    if(signedIn) $('footNavDash').classList.remove('hide');
    else $('footNavDash').classList.add('hide');
  }
}

function setupAuthPasswordControls(){}

if($('authClose')) $('authClose').onclick=()=>$('authDlg').close();

async function doSignOut(){
  try{ localStorage.removeItem('tmc_auth_session'); }catch(e){}
  await sb.auth.signOut();
  session=null;
  myProfile=null;
  myCerts=[];
  current=null;
  connectedDiscordUser=null;
  discordDmCodeSent=false;
  discordDmCodeVerified=false;
  currentDmCode='';
  fillForm(null);
  renderMyCerts();
  authBtns();
  if($('navDash')) $('navDash').classList.add('hide');
  if($('mNavDash')) $('mNavDash').classList.add('hide');
  if($('footNavDash')) $('footNavDash').classList.add('hide');
  setPage('showcase');
}

$('authBtn').onclick=async()=>{
  if(session){
    await doSignOut();
  } else {
    openAuth();
  }
};
if($('mAuthBtn')){
  $('mAuthBtn').onclick=async()=>{
    if($('mobileNavClose')) $('mobileNavClose').click();
    if(session){
      await doSignOut();
    } else {
      openAuth();
    }
  };
}
$('heroJoin').onclick=()=>{
  if(session){
    setPage('dashboard');
  } else {
    openAuth();
  }
};
let connectedDiscordUser = null;

window.oauthPopup = null;
window.closeOAuthPopup = function(){
  try {
    if(window.oauthPopup && !window.oauthPopup.closed){
      window.oauthPopup.close();
    }
  } catch(e){}
  let attempts = 0;
  const poll = setInterval(() => {
    attempts++;
    try {
      if(window.oauthPopup && !window.oauthPopup.closed){
        window.oauthPopup.close();
      } else {
        clearInterval(poll);
      }
    } catch(e){
      clearInterval(poll);
    }
    if(attempts >= 30) clearInterval(poll);
  }, 100);
};

function setupDiscordAuthControls(){
  const btnOAuth = $('btnOAuthDiscord') || $('btnOAuthGithub');
  let oauthPollTimer = null;

  async function handleOAuthSuccess(payload){
    if(oauthPollTimer) { clearInterval(oauthPollTimer); oauthPollTimer = null; }
    window.closeOAuthPopup();
    try { localStorage.removeItem('tmc_oauth_payload'); } catch(e){}
    try { localStorage.removeItem('tmc_oauth_close'); } catch(e){}

    const dlg = $('authDlg');
    if(dlg){
      if(typeof dlg.close === 'function') dlg.close();
      dlg.removeAttribute('open');
    }

    if(payload?.user){
      connectedDiscordUser = payload.user;
      await loginWithDiscordUser(connectedDiscordUser);
    }
  }

  window.handleOAuthSuccess = handleOAuthSuccess;

  if(btnOAuth){
    btnOAuth.onclick = async () => {
      clearMsg($('aMsg'));
      try {
        const redirectUri = `${window.location.origin}/auth/discord/callback`;
        const res = await fetch(`/api/auth/discord/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
        const data = await res.json();
        try { localStorage.removeItem('tmc_oauth_payload'); } catch(e){}
        try { localStorage.removeItem('tmc_oauth_close'); } catch(e){}

        window.oauthPopup = window.open(data.url || 'https://discord.com/channels/@me', 'discord_oauth_popup', 'width=600,height=700');
        if(!window.oauthPopup){
          setMsg($('aMsg'), 'Please allow popups in your browser to authorize with Discord.', 'err');
          return;
        }

        if(oauthPollTimer) clearInterval(oauthPollTimer);
        oauthPollTimer = setInterval(() => {
          try {
            const raw = localStorage.getItem('tmc_oauth_payload');
            if(raw){
              const parsed = JSON.parse(raw);
              if(parsed && parsed.type === 'OAUTH_AUTH_SUCCESS'){
                window.closeOAuthPopup();
                handleOAuthSuccess(parsed);
                return;
              }
            }
          } catch(e){}
          if(!window.oauthPopup || window.oauthPopup.closed){
            clearInterval(oauthPollTimer);
            oauthPollTimer = null;
          }
        }, 150);
      } catch(e){
        setMsg($('aMsg'), 'Failed to connect to Discord authorization service. Please try again.', 'err');
      }
    };
  }

  // 1. Cross-origin message listener for OAuth popup completion
  window.addEventListener('message', async (event) => {
    if(event.data?.type === 'CLOSE_OAUTH_POPUP'){
      window.closeOAuthPopup();
    }
    if(event.data?.type === 'OAUTH_AUTH_SUCCESS' && (event.data?.provider === 'discord' || event.data?.provider === 'github')){
      window.closeOAuthPopup();
      await handleOAuthSuccess(event.data);
    }
  });

  // 2. Storage event listener (when popup writes to localStorage)
  window.addEventListener('storage', async (event) => {
    if(event.key === 'tmc_oauth_close'){
      window.closeOAuthPopup();
    }
    if(event.key === 'tmc_oauth_payload' && event.newValue){
      try {
        const parsed = JSON.parse(event.newValue);
        if(parsed && parsed.type === 'OAUTH_AUTH_SUCCESS'){
          window.closeOAuthPopup();
          await handleOAuthSuccess(parsed);
        }
      } catch(e){}
    }
  });

  // 3. BroadcastChannel listener
  try {
    const bc = new BroadcastChannel('tmc_oauth_channel');
    bc.onmessage = async (event) => {
      if(event.data?.type === 'CLOSE_OAUTH_POPUP'){
        window.closeOAuthPopup();
      }
      if(event.data?.type === 'OAUTH_AUTH_SUCCESS'){
        window.closeOAuthPopup();
        await handleOAuthSuccess(event.data);
      }
    };
  } catch(e){}
}

async function loginWithDiscordUser(discordUser){
  if(!discordUser){
    setMsg($('aMsg'), t('a.discord_user_req') || 'Please select a Discord account.', 'err');
    return;
  }
  if($('aAgreeTerms') && !$('aAgreeTerms').checked){
    setMsg($('aMsg'), t('m.terms_required') || 'Please accept the Terms & Conditions and Privacy Policy to continue.', 'err');
    return;
  }

  try {
    const res = await sb.auth.connectWithDiscord(discordUser);
    if(res.error){
      setMsg($('aMsg'), res.error.message || 'Failed to authenticate with Discord.', 'err');
      return;
    }
    session = res.data?.session || null;

    // Permanently persist session in localStorage so user stays logged in until they click Sign Out
    if(session){
      try {
        localStorage.setItem('tmc_auth_session', JSON.stringify(session));
      } catch(e){}
    }

    await onSession(session);
    fx.confetti();
    setMsg($('aMsg'), t('m.a_up_ok') || 'Discord account connected! Redirecting...', 'ok');
    
    // Close modal dialog immediately
    const dlg = $('authDlg');
    if(dlg){
      if(typeof dlg.close === 'function') dlg.close();
      dlg.removeAttribute('open');
    }
    authBtns();
    setPage('dashboard');
  } catch(e){
    setMsg($('aMsg'), 'Failed to connect with Discord. Try again.', 'err');
  }
}

/* ---------- DASHBOARD (MY PROFILE & AVATAR UPLOAD) ---------- */
function setupAvatarControls(){
  if($('btnIconUpload')){
    $('btnIconUpload').onclick=()=>{
      avatarMode='upload';
      $('btnIconUpload').setAttribute('aria-pressed','true');
      if($('btnIconUrl')) $('btnIconUrl').setAttribute('aria-pressed','false');
      if($('paneIconUpload')) $('paneIconUpload').classList.remove('hide');
      if($('paneIconUrl')) $('paneIconUrl').classList.add('hide');
      preview();
    };
  }
  if($('btnIconUrl')){
    $('btnIconUrl').onclick=()=>{
      avatarMode='url';
      $('btnIconUrl').setAttribute('aria-pressed','true');
      if($('btnIconUpload')) $('btnIconUpload').setAttribute('aria-pressed','false');
      if($('paneIconUrl')) $('paneIconUrl').classList.remove('hide');
      if($('paneIconUpload')) $('paneIconUpload').classList.add('hide');
      preview();
    };
  }

  if($('pAvatarFile')){
    $('pAvatarFile').onchange=e=>{
      const file=e.target.files&&e.target.files[0];
      if(file){
        const reader=new FileReader();
        reader.onload=ev=>{
          editAvatarImg=ev.target.result;
          preview();
        };
        reader.readAsDataURL(file);
      }
    };
  }
  if($('pAvatarUrl')){
    $('pAvatarUrl').oninput=e=>{
      editAvatarImg=e.target.value.trim();
      preview();
    };
  }
}

/* ---------- CUSTOM PROFILE LINKS (DYNAMIC USER LINKS) ---------- */
function renderCustomLinksEditor(){
  const listEl=$('customLinksList');
  if(!listEl) return;
  if(!customLinks.length){
    listEl.innerHTML=`<div class="note" style="padding:10px;text-align:center;background:var(--surface-inset);border-radius:12px;border:1px dashed var(--line-subtle)">No custom links added yet. Click "+ Add Custom Link" above to add your Discord server, SMP store, portfolio, or other channels.</div>`;
    return;
  }

  const platforms=[
    {id:'auto', name:'Auto-detect Brand'},
    {id:'web', name:'Website / Portfolio'},
    {id:'discord', name:'Discord Server'},
    {id:'yt', name:'YouTube Channel'},
    {id:'twitch', name:'Twitch Stream'},
    {id:'insta', name:'Instagram'},
    {id:'x', name:'X (Twitter)'},
    {id:'tiktok', name:'TikTok'},
    {id:'reddit', name:'Reddit'},
    {id:'github', name:'GitHub'},
    {id:'telegram', name:'Telegram'},
    {id:'store', name:'Merch / Shop'}
  ];

  listEl.innerHTML=customLinks.map((cl, i)=>`
    <div class="custom-link-row" data-idx="${i}" style="display:flex;gap:8px;align-items:center;background:var(--surface-inset);padding:8px 12px;border-radius:12px;border:1px solid var(--line-subtle);flex-wrap:wrap">
      <div style="flex:1;min-width:130px">
        <input class="cl-title" type="text" placeholder="Title (e.g. SMP Server)" value="${esc(cl.title||'')}" style="padding:8px;font-size:13px" maxlength="40">
      </div>
      <div style="flex:2;min-width:180px">
        <input class="cl-url" type="url" placeholder="https://..." value="${esc(cl.url||'')}" style="padding:8px;font-size:13px" maxlength="200">
      </div>
      <div style="min-width:130px">
        <select class="cl-plat" style="padding:8px;font-size:12px">
          ${platforms.map(p=>`<option value="${p.id}" ${cl.platform===p.id?'selected':''}>${p.name}</option>`).join('')}
        </select>
      </div>
      <button type="button" class="icon-btn cl-del" data-del-idx="${i}" aria-label="Remove link" style="color:var(--danger)">✕</button>
    </div>
  `).join('');

  listEl.querySelectorAll('.custom-link-row').forEach(row=>{
    const idx=parseInt(row.dataset.idx,10);
    const titleInput=row.querySelector('.cl-title');
    const urlInput=row.querySelector('.cl-url');
    const platSelect=row.querySelector('.cl-plat');
    const delBtn=row.querySelector('.cl-del');

    if(titleInput) titleInput.oninput=e=>{ customLinks[idx].title=e.target.value; preview(); };
    if(urlInput) urlInput.oninput=e=>{ customLinks[idx].url=e.target.value; preview(); };
    if(platSelect) platSelect.onchange=e=>{ customLinks[idx].platform=e.target.value; preview(); };
    if(delBtn) delBtn.onclick=()=>{ customLinks.splice(idx,1); renderCustomLinksEditor(); preview(); };
  });
}

function setupCustomLinksControls(){
  const addBtn=$('btnAddCustomLink');
  if(addBtn){
    addBtn.onclick=()=>{
      customLinks.push({title:'', url:'', platform:'auto'});
      renderCustomLinksEditor();
      preview();
    };
  }
}

function collectCustomLinks(){
  return customLinks.filter(l=>l&&l.url&&l.url.trim().length>3).map(l=>({
    title:(l.title||'').trim()||l.url.replace(/^https?:\/\//,'').slice(0,20),
    url:l.url.trim(),
    platform:l.platform||'auto'
  }));
}

function fillSelects(){
  const s=$('pStyle').value;
  $('pStyle').innerHTML=['raised','flat','outline'].map(x=>`<option value="${x}">${esc(t('style.'+x))}</option>`).join('');
  if(s)$('pStyle').value=s;
}
function swatches(){
  $('pSwatches').innerHTML=COLORS.map(c=>`<button type="button" class="sw" data-c="${c}" style="background:${c}${c===editColor?';outline:3px solid #fff;outline-offset:2px':''}" aria-label="${c}"></button>`).join('');
  $('pSwatches').querySelectorAll('button').forEach(b=>b.onclick=()=>{editColor=b.dataset.c;$('pColor').value=editColor;swatches();preview()});
}
$('pColor').oninput=e=>{editColor=e.target.value;swatches();preview()};

function collectSocials(){
  return {
    yt:$('sYt').value.trim()||null,
    discord:$('sDiscord').value.trim()||null,
    insta:$('sInsta').value.trim()||null,
    twitch:$('sTwitch').value.trim()||null,
    x:$('sX').value.trim()||null
  };
}

function formData(){
  return {
    display_name:$('pName').value.trim(),
    channel_name:$('pChannel').value.trim(),
    channel_url:$('pUrl').value.trim()||null,
    bio:$('pBio').value.trim()||null,
    accent:safeColor(editColor),
    card_style:$('pStyle').value||'raised',
    avatar_image:editAvatarImg||null,
    socials:collectSocials(),
    custom_links:collectCustomLinks(),
    is_public:$('pPublic').checked
  };
}
function preview(){
  const d=formData();
  $('pPreview').innerHTML=cardHtml({...d,id:'x',handle:'preview',display_name:d.display_name||t('cert.sample.n'),channel_name:d.channel_name||t('cert.sample.c'),bio:d.bio||'…',likes:myProfile?myProfile.likes:0,votes:myProfile?myProfile.votes:0,cert_count:myProfile?myProfile.cert_count:1},{preview:true});
}
['pName','pChannel','pBio','pStyle','pPublic','pUrl','sYt','sDiscord','sInsta','sTwitch','sX'].forEach(id=>{
  if($(id)) $(id).addEventListener('input',preview);
});

function fillForm(p){
  fillSelects();
  $('pHandle').value=p?p.handle:'';$('pHandle').disabled=!!p;
  $('pName').value=p?p.display_name:'';$('pChannel').value=p?p.channel_name:'';$('pUrl').value=p&&p.channel_url||'';
  $('pBio').value=p&&p.bio||'';$('pStyle').value=p?p.card_style:'raised';
  editColor=p?safeColor(p.accent):'#1f9d5e';
  editAvatarImg=p?(p.avatar_image||p.avatar_url||''):'';
  $('pColor').value=editColor;
  $('pPublic').checked=p?p.is_public:true;
  
  if(p&&p.socials){
    $('sYt').value=p.socials.yt||'';
    $('sDiscord').value=p.socials.discord||'';
    $('sInsta').value=p.socials.insta||'';
    $('sTwitch').value=p.socials.twitch||'';
    $('sX').value=p.socials.x||'';
  } else {
    ['sYt','sDiscord','sInsta','sTwitch','sX'].forEach(i=>$(i).value='');
  }

  // Populate custom links
  customLinks=(p&&Array.isArray(p.custom_links))?JSON.parse(JSON.stringify(p.custom_links)):[];
  renderCustomLinksEditor();

  if(editAvatarImg){
    if(editAvatarImg.startsWith('data:')){
      avatarMode='upload';
      if($('btnIconUpload')) $('btnIconUpload').setAttribute('aria-pressed','true');
      if($('btnIconUrl')) $('btnIconUrl').setAttribute('aria-pressed','false');
      if($('paneIconUpload')) $('paneIconUpload').classList.remove('hide');
      if($('paneIconUrl')) $('paneIconUrl').classList.add('hide');
    } else {
      avatarMode='url';
      $('pAvatarUrl').value=editAvatarImg;
      if($('btnIconUrl')) $('btnIconUrl').setAttribute('aria-pressed','true');
      if($('btnIconUpload')) $('btnIconUpload').setAttribute('aria-pressed','false');
      if($('paneIconUrl')) $('paneIconUrl').classList.remove('hide');
      if($('paneIconUpload')) $('paneIconUpload').classList.add('hide');
    }
  } else {
    avatarMode='upload';
    if($('btnIconUpload')) $('btnIconUpload').setAttribute('aria-pressed','true');
    if($('btnIconUrl')) $('btnIconUrl').setAttribute('aria-pressed','false');
    if($('paneIconUpload')) $('paneIconUpload').classList.remove('hide');
    if($('paneIconUrl')) $('paneIconUrl').classList.add('hide');
  }

  swatches();preview();
}

async function loadMine(){
  if(!session){
    myProfile=null;
    fillForm(null);
    return;
  }
  const {data}=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
  myProfile=data||null;
  fillForm(myProfile);
  if(myProfile){
    if($('welcomeCertBanner')) $('welcomeCertBanner').classList.remove('hide');
  }
}

async function onSession(s){
  session=s;
  try{
    if(s) localStorage.setItem('tmc_auth_session', JSON.stringify(s));
    else localStorage.removeItem('tmc_auth_session');
  }catch(e){}
  authBtns();
  if(session){
    await loadMine();
    await loadCerts();
    if(myCerts.length && !current) showCert(myCerts[0]);
    try {
      const {data}=await sb.rpc('my_likes');
      myLikes=new Set(data||[]);
    } catch(e){}
    await loadMyVote();
  } else {
    myProfile=null;
    myCerts=[];
    current=null;
    myLikes=new Set();
    myVoteId=null;
    fillForm(null);
    renderMyCerts();
    if($('dlBtn')) $('dlBtn').disabled=true;
  }
  renderGrid();
}

async function claimOrRedownloadWelcome(){
  if(!session) return openAuth();
  await loadCerts();
  let welcomeCert = myCerts.find(c=>c.is_welcome);
  if(!welcomeCert && myCerts.length){
    welcomeCert = myCerts[0];
  }
  if(!welcomeCert){
    const rnd=()=>Math.random().toString(36).substring(2,6).toUpperCase();
    const newCert={
      id:'cert-welcome-'+Date.now(),
      cert_code:`CERT-TMC-WELCOME-${rnd()}`,
      token:`TMC-WELCOME-${rnd()}`,
      recipient_name:(myProfile&&myProfile.display_name)||(session.user&&session.user.name)||'Minecraft Creator',
      channel_name:(myProfile&&myProfile.channel_name)||'Community Member',
      award:'Welcome to Tamil MC Community',
      award_ta:'தமிழ் MC சமூக வரவேற்பு',
      heading:'Community Welcome Certificate',
      heading_ta:'சமூக வரவேற்புச் சான்றிதழ்',
      content_title:'Official Member of TMC Awards',
      content_url:(myProfile&&myProfile.channel_url)||'',
      message:'Welcome to the Tamil Minecraft community! Official certified creator of TMC Awards.',
      theme:'emerald',
      icon:'shield',
      type_name:'Community Welcome',
      status:'redeemed',
      user_id:session.user.id,
      is_welcome:true,
      issued_at:new Date().toISOString()
    };
    try {
      const raw = localStorage.getItem('tmc_live_db_v3');
      if(raw){
        const dbState = JSON.parse(raw);
        if(!dbState.certs) dbState.certs = [];
        dbState.certs.unshift(newCert);
        localStorage.setItem('tmc_live_db_v3', JSON.stringify(dbState));
      }
    } catch(e){}
    welcomeCert = newCert;
    await loadCerts();
  }
  if(welcomeCert){
    showCert(welcomeCert);
    if($('dlBtn')){
      $('dlBtn').disabled = false;
      $('dlBtn').classList.add('btn-pulse-ready');
      setTimeout(()=>{$('dlBtn')?.classList.remove('btn-pulse-ready');}, 2500);
    }
    openWelcomeCertModal(welcomeCert);
  }
}

$('pSave').onclick=async()=>{
  if(!session) return openAuth();
  const d=formData(),handle=$('pHandle').value.trim().toLowerCase();
  if(d.display_name.length<2||d.channel_name.length<2)return setMsg($('pMsg'),t('m.name2'),'err');
  if(d.channel_url&&!safeUrl(d.channel_url))return setMsg($('pMsg'),t('m.url'),'err');
  
  $('pSave').disabled=true;
  let error,res;
  const isNew = !myProfile;
  if(myProfile){
    res=await sb.from('profiles').update(d).eq('id',session.user.id);
    error=res.error;
  } else {
    if(!/^[a-z0-9_]{3,24}$/.test(handle)){$('pSave').disabled=false;return setMsg($('pMsg'),t('m.handle'),'err')}
    res=await sb.from('profiles').insert({...d,id:session.user.id,handle});
    error=res.error;
  }
  $('pSave').disabled=false;
  if(error)return setMsg($('pMsg'),error.code==='23505'?t('m.taken'):t('m.save_err'),'err');
  setMsg($('pMsg'),t('m.saved'),'ok');
  fx.confetti();
  await loadMine();
  await loadCerts();
  await loadPublic();

  // Guarantee Welcome Certificate is in inventory and immediately enable download button!
  let welcomeCert = myCerts.find(c=>c.is_welcome) || (res&&res.welcomeCert) || (myCerts.length?myCerts[0]:null);
  if(welcomeCert){
    showCert(welcomeCert);
  }
  const dlBtn = $('dlBtn');
  if(dlBtn){
    dlBtn.disabled = false;
    dlBtn.classList.add('btn-pulse-ready');
    setTimeout(()=>{ dlBtn.classList.remove('btn-pulse-ready'); }, 3000);
  }
  if($('dlBtnHint')){
    $('dlBtnHint').textContent = '✓ Ready to download! Certificate saved in your inventory.';
  }
  if($('welcomeCertBanner')) $('welcomeCertBanner').classList.remove('hide');

  // Pop up to download welcome certificate!
  setTimeout(()=>{ openWelcomeCertModal(welcomeCert); }, 400);
};
if($('pDelete')){
  $('pDelete').remove();
}

/* ---------- WELCOME CERTIFICATE POPUP MODAL ---------- */
function openWelcomeCertModal(cert){
  const targetCert = cert || (myCerts && myCerts.find(c=>c.is_welcome)) || (myCerts && myCerts[0]) || null;
  const certData = targetCert || {
    recipient_name: (myProfile && myProfile.display_name) || (session && session.user && session.user.name) || 'Minecraft Creator',
    channel_name: (myProfile && myProfile.channel_name) || 'Tamil MC Crafter',
    award: 'Welcome to Tamil MC Community',
    award_ta: 'தமிழ் MC சமூக வரவேற்பு',
    heading: 'Community Welcome Certificate',
    heading_ta: 'சமூக வரவேற்புச் சான்றிதழ்',
    message: 'Welcome to the Tamil Minecraft community! Official certified creator of TMC Awards.',
    cert_code: 'CERT-TMC-WELCOME-' + Math.random().toString(36).substring(2,6).toUpperCase(),
    issued_at: new Date().toISOString()
  };

  if($('welcomeCertCode')) $('welcomeCertCode').textContent = certData.cert_code || 'CERT-TMC-WELCOME';
  if($('welcomeCertCanvas')) drawCert($('welcomeCertCanvas'), certData, certData.theme || 'emerald');

  if($('welcomeCertDlg')) $('welcomeCertDlg').showModal();
  fx.confetti();
}

function setupWelcomeCertModal(){
  if($('welcomeCertClose')) $('welcomeCertClose').onclick = () => $('welcomeCertDlg').close();
  if($('btnCloseWelcomeModal')) $('btnCloseWelcomeModal').onclick = () => $('welcomeCertDlg').close();
  if($('btnOpenWelcomeModal')) $('btnOpenWelcomeModal').onclick = () => openWelcomeCertModal();
  if($('btnClaimWelcomeInventory')) $('btnClaimWelcomeInventory').onclick = claimOrRedownloadWelcome;

  if($('btnDlWelcomeCert')){
    $('btnDlWelcomeCert').onclick = () => {
      const cv = $('welcomeCertCanvas');
      if(!cv) return;
      const btn = $('btnDlWelcomeCert');
      const prevText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '⏳ Saving...';
      const h = (myProfile && myProfile.handle) || 'tmc_member';
      downloadCanvas(cv, `TMC_Welcome_Certificate_${h}.png`, (ok) => {
        btn.disabled = false;
        btn.textContent = ok ? '✓ Saved!' : prevText;
        setTimeout(() => { if(btn) btn.textContent = prevText; }, 2500);
      });
    };
  }

  if($('btnCopyWelcomeCode')){
    $('btnCopyWelcomeCode').onclick = async () => {
      const code = $('welcomeCertCode').textContent;
      try {
        await navigator.clipboard.writeText(code);
        $('btnCopyWelcomeCode').textContent = t('cert.code_copied');
        setTimeout(() => { if($('btnCopyWelcomeCode')) $('btnCopyWelcomeCode').textContent = t('cert.copy_code'); }, 2000);
      } catch(e){}
    };
  }
}

/* ---------- CERTIFICATES (IN DASHBOARD) ---------- */
function themeButtons(){
  $('themes').innerHTML=Object.keys(THEMES).map(k=>`<button class="chip" data-t="${k}" aria-pressed="${k===themeKey}">${esc(t('theme.'+k))}</button>`).join('');
  $('themes').querySelectorAll('button').forEach(b=>b.onclick=()=>{themeKey=b.dataset.t;themeButtons();if(current)drawCert($('cert'),current,themeKey)});
}
function showCert(c){
  current=c;
  themeKey=c.theme||'emerald';
  themeButtons();
  drawCert($('cert'),c,themeKey);
  const dlBtn=$('dlBtn');
  if(dlBtn){
    dlBtn.disabled=false;
  }
  const hint=$('dlBtnHint');
  if(hint){
    hint.textContent=`Ready: ${c.cert_code} (${esc(certField(c,'award'))})`;
  }
}
function renderMyCerts(){
  const container = $('myCerts');
  if(!container) return;
  if(!myCerts.length){
    container.innerHTML=`
      <div class="empty glass" style="padding:22px;text-align:center">
        <div style="font-size:28px;margin-bottom:6px">📜</div>
        <p style="margin:0 0 14px;color:var(--muted);font-size:14px">${esc(t('certs.none')||'No certificates claimed yet.')}</p>
        <button type="button" class="btn small primary" id="btnClaimWelcomeEmpty">🎓 Claim / Redownload Welcome Certificate</button>
      </div>`;
    const btn = $('btnClaimWelcomeEmpty');
    if(btn) btn.onclick = claimOrRedownloadWelcome;
    return;
  }
  container.innerHTML = myCerts.map((c,i)=>`
    <div class="list-item cert-inventory-item">
      <div style="flex:1;min-width:180px">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:16px">${c.is_welcome?'🎓':'🏆'}</span>
          <b style="color:var(--text)">${esc(certField(c,'award'))}</b>
        </div>
        <div class="by" style="color:var(--muted);font-size:13px;margin-top:2px">
          ${esc(certField(c,'heading'))} · <code style="color:var(--em);font-weight:700">${esc(c.cert_code)}</code>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button type="button" class="btn small" data-c-prev="${i}">${t('certs.prev')||'Preview'}</button>
        <button type="button" class="btn small primary" data-c-dl="${i}">📥 Download</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-c-prev]').forEach(b=>{
    b.onclick=()=>showCert(myCerts[+b.dataset.cPrev]);
  });
  container.querySelectorAll('[data-c-dl]').forEach(b=>{
    b.onclick=()=>{
      const c = myCerts[+b.dataset.cDl];
      showCert(c);
      const prevText = b.textContent;
      b.disabled = true;
      b.textContent = '⏳ Saving...';
      downloadCanvas($('cert'), `TMC_Certificate_${c.cert_code}.png`, (ok) => {
        b.disabled = false;
        b.textContent = ok ? '✓ Saved!' : prevText;
        setTimeout(() => { if(b) b.textContent = prevText; }, 2500);
      });
    };
  });
}
$('dlBtn').onclick=()=>{
  if(!current) return;
  const btn = $('dlBtn');
  const prevText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Saving...';
  downloadCanvas($('cert'), 'certificate-'+current.cert_code+'.png', (ok) => {
    btn.disabled = false;
    btn.textContent = ok ? '✓ Saved!' : prevText;
    setTimeout(() => { if(btn) btn.textContent = prevText; }, 2500);
  });
};
async function loadCerts(){const {data}=await sb.rpc('my_certificates');myCerts=data||[];renderMyCerts();if(myCerts.length&&!current)showCert(myCerts[0])}

/* ---------- REDEEM & VERIFY PAGE ---------- */
$('tabRedeemClaim').onclick=()=>{
  $('tabRedeemClaim').setAttribute('aria-pressed','true');
  $('tabRedeemVerify').setAttribute('aria-pressed','false');
  $('redeemClaimPane').classList.remove('hide');
  $('redeemVerifyPane').classList.add('hide');
};
$('tabRedeemVerify').onclick=()=>{
  $('tabRedeemVerify').setAttribute('aria-pressed','true');
  $('tabRedeemClaim').setAttribute('aria-pressed','false');
  $('redeemVerifyPane').classList.remove('hide');
  $('redeemClaimPane').classList.add('hide');
};

$('rBtn').onclick=async()=>{
  clearMsg($('rMsg'));
  const tk=$('rToken').value.trim();
  if(!tk) return setMsg($('rMsg'),t('m.token'),'err');
  $('rBtn').disabled=true;
  const {data,error}=await sb.rpc('redeem_certificate',{p_token:tk});
  $('rBtn').disabled=false;
  if(error||!data) return setMsg($('rMsg'),t('m.wrong'),'err');
  if(!data.ok){
    const m={invalid_token:t('m.tok_bad'),locked:t('m.locked'),sign_in_required:t('m.signin')};
    return setMsg($('rMsg'),m[data.error]||t('m.wrong'),'err');
  }
  claimedCert=data.cert;
  $('rToken').value='';
  setMsg($('rMsg'),t('m.redeemed'),'ok');
  fx.confetti();
  drawCert($('rCertCanvas'),claimedCert,claimedCert.theme||'emerald');
  $('rDlBtn').disabled=false;
  if(session){
    await loadCerts();
    if(myCerts.length) showCert(myCerts[0]);
  }
  await loadPublic();
};
$('rDlBtn').onclick=()=>{
  if(!claimedCert) return;
  const btn = $('rDlBtn');
  const prevText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Saving...';
  downloadCanvas($('rCertCanvas'),'certificate-'+claimedCert.cert_code+'.png', (ok) => {
    btn.disabled = false;
    btn.textContent = ok ? '✓ Saved!' : prevText;
    setTimeout(() => { if(btn) btn.textContent = prevText; }, 2500);
  });
};

$('vBtn').onclick=async()=>{
  clearMsg($('vMsg'));
  const code=$('vCode').value.trim();
  if(!code)return setMsg($('vMsg'),t('m.v_enter'),'err');
  $('vBtn').disabled=true;
  const {data,error}=await sb.rpc('verify_certificate',{p_code:code});
  $('vBtn').disabled=false;
  if(error)return setMsg($('vMsg'),t('m.v_err'),'err');
  if(!data||!data.length)return setMsg($('vMsg'),t('m.v_none'),'err');
  const c=data[0];
  if(c.status==='revoked')return setMsg($('vMsg'),t('m.v_revoked'),'err');
  verifiedCert=c;
  setMsg($('vMsg'),t('m.v_ok',{n:c.recipient_name,a:certField(c,'award')}),'ok');
  drawCert($('vCert'),c,c.theme||'emerald');
  $('vDlBtn').disabled=false;
};
$('vDlBtn').onclick=()=>{
  if(!verifiedCert) return;
  const btn = $('vDlBtn');
  const prevText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Saving...';
  downloadCanvas($('vCert'),'verified-'+verifiedCert.cert_code+'.png', (ok) => {
    btn.disabled = false;
    btn.textContent = ok ? '✓ Saved!' : prevText;
    setTimeout(() => { if(btn) btn.textContent = prevText; }, 2500);
  });
};

/* ---------- 3D MINECRAFT CUP TILT ---------- */
const trophyStage=document.querySelector('.trophy-stage');
const heroCup=$('heroCup');
if(trophyStage&&heroCup&&matchMedia('(pointer:fine)').matches){
  trophyStage.addEventListener('pointermove',e=>{
    const r=trophyStage.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-0.5;
    const y=(e.clientY-r.top)/r.height-0.5;
    heroCup.style.transform=`rotateX(${-12 - y*20}deg) rotateY(${x*40}deg)`;
  });
  trophyStage.addEventListener('pointerleave',()=>{
    heroCup.style.transform='';
  });
}


function samples(){
  drawCert($('cert'),current||{recipient_name:t('cert.sample.n'),channel_name:t('cert.sample.c'),award:'Best Creator Award',message:t('cert.sample.m'),cert_code:'CERT-XXXXXXXX',issued_at:new Date()},current?themeKey:'emerald');
  drawCert($('rCertCanvas'),claimedCert||{recipient_name:t('cert.sample.n'),channel_name:t('cert.sample.c'),award:'Welcome to Tamil MC Community',message:t('cert.sample.m'),cert_code:'CERT-XXXXXXXX',issued_at:new Date()},'emerald');
  drawCert($('vCert'),verifiedCert||{recipient_name:t('cert.sample.n'),channel_name:t('cert.sample.c'),award:'Best Creator Award',cert_code:'CERT-XXXXXXXX',issued_at:new Date()},verifiedCert?verifiedCert.theme:'emerald');
}
/* ---------- TERMS & CONDITIONS & PRIVACY POLICY MODALS ---------- */
function renderLegalContent(){
  const isTa=lang()==='ta';
  if($('termsBody')){
    $('termsBody').innerHTML=isTa?`
      <div class="policy-sec">
        <h3><span>📜</span> 1. அறிமுகம் & விதிமுறைகள் ஏற்பு</h3>
        <p>TMC Awards (தமிழ் மைன்கிராஃப்ட் சமூக விருதுகள்) தளத்திற்கு உங்களை வரவேற்கிறோம். இத்தளம் தமிழ் மைன்கிராஃப்ட் படைப்பாளர்கள், வீடியோ உருவாக்குநர்கள் மற்றும் சமூக உறுப்பினர்களைக் கொண்டாடுவதற்காக உருவாக்கப்பட்டது. இத்தளத்தைப் பயன்படுத்துவதன் மூலமும், கணக்கு தொடங்குவதன் மூலமும் நீங்கள் இந்த விதிமுறைகளை முழுமையாக ஒப்புக்கொள்கிறீர்கள்.</p>
      </div>

      <div class="policy-sec">
        <h3><span>🔒</span> 2. கணக்கு உருவாக்குதல் & பாதுகாப்பு</h3>
        <p>படைப்பாளர் சுயவிவரத்தை உருவாக்க சரியான மின்னஞ்சல் மற்றும் குறைந்தபட்சம் 10 எழுத்துகள் கொண்ட பாதுகாப்பான கடவுச்சொல்லைப் பயன்படுத்த வேண்டும். உங்கள் கணக்கின் கடவுச்சொல் மற்றும் அதன் கீழ் நிகழும் செயல்பாடுகளுக்கு நீங்களே முழுப் பொறுப்பாவீர்கள்.</p>
      </div>

      <div class="policy-sec">
        <h3><span>🤝</span> 3. படைப்பாளர் நடத்தை நெறிகள்</h3>
        <p>தமிழ் MC சமூகம் நட்பு, நேர்மறை அணுகுமுறை மற்றும் பரஸ்பர மரியாதையை அடிப்படையாகக் கொண்டது. பின்வரும் நடத்தைகள் முற்றிலும் தடைசெய்யப்பட்டுள்ளன:</p>
        <ul>
          <li>வெறுப்புப் பேச்சு, பிற படைப்பாளர்களை அவமதித்தல் அல்லது துன்புறுத்துதல்.</li>
          <li>போலியான சேனல் இணைப்புகள் அல்லது பிற படைப்பாளர்களின் அடையாளத்தைத் தவறாகப் பயன்படுத்துதல்.</li>
          <li>சட்டவிரோத அல்லது பொருத்தமற்ற உள்ளடக்கங்களை இணைத்தல்.</li>
        </ul>
        <p style="margin-top:8px">விதிமீறும் சுயவிவரங்கள் முன்னறிவிப்பின்றி தள நிர்வாகத்தால் நீக்கப்படும் அல்லது மறைக்கப்படும்.</p>
      </div>

      <div class="policy-sec">
        <h3><span>🏆</span> 4. சிறந்த படைப்பாளர் வாக்கெடுப்பு (Fair Play)</h3>
        <p>TMC Awards வாக்கெடுப்பு நேர்மையான முறையில் நடைபெற வேண்டும். ஒவ்வொரு பார்வையாளருக்கும் ஒரு வாக்கு மட்டுமே அனுமதிக்கப்படும். தானியங்கி போட்கள் (bots), பல போலி கணக்குகள் அல்லது வாக்கு முறைகேடுகள் கண்டறியப்பட்டால், அத்தகைய வாக்குகள் தானாகக் கழிக்கப்பட்டு சுயவிவரம் தகுதிநீக்கம் செய்யப்படும்.</p>
      </div>

      <div class="policy-sec">
        <h3><span>📜</span> 5. சமூக சான்றிதழ்கள்</h3>
        <p>TMC Awards வழங்கும் வரவேற்பு மற்றும் சாதனைச் சான்றிதழ்கள் சமூக அங்கீகாரத்திற்காக வழங்கப்படுபவை. டோக்கன்கள் ஒருமுறை மட்டுமே பயன்படுத்தப்படக்கூடியவை. சான்றிதழ் டோக்கன்களை போலியாக உருவாக்குவதோ அல்லது மாற்றுவதோ தடைசெய்யப்பட்டுள்ளது.</p>
      </div>

      <div class="policy-sec">
        <h3><span>⚠️</span> 6. Mojang & Microsoft மறுப்புரிமை</h3>
        <p>TMC Awards என்பது ஒரு ரசிகர் சமூகத் திட்டமாகும். இது அதிகாரப்பூர்வ Minecraft தளம் அல்ல; Mojang Studios அல்லது Microsoft நிறுவனத்துடன் எந்தவித வணிக ரீதியான அல்லது உத்தியோகபூர்வ தொடர்பும் இல்லை. "Minecraft" என்பது Mojang Synergies AB-ன் பதிவுசெய்யப்பட்ட வர்த்தக முத்திரையாகும்.</p>
      </div>
    `:`
      <div class="policy-sec">
        <h3><span>📜</span> 1. Acceptance of Terms</h3>
        <p>Welcome to TMC Awards (Tamil Minecraft Community Awards). By accessing this website, creating an account, voting, or redeeming official certificates, you acknowledge and agree to comply with these Terms and Conditions.</p>
      </div>

      <div class="policy-sec">
        <h3><span>🔒</span> 2. Account Registration & Security</h3>
        <p>When creating an account, you must provide a valid email and select a secure password of at least 10 characters with confirmation. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your profile.</p>
      </div>

      <div class="policy-sec">
        <h3><span>🤝</span> 3. Creator Conduct & Showcase Standards</h3>
        <p>TMC Awards is dedicated to fostering a supportive, family-friendly, and creative space for Tamil gamers and content creators. Prohibited conduct includes:</p>
        <ul>
          <li>Harassment, defamation, hate speech, or offensive content in bios, handles, or links.</li>
          <li>Impersonating other content creators or submitting misleading channel links.</li>
          <li>Distributing malicious links or pirated assets.</li>
        </ul>
        <p style="margin-top:8px">Accounts violating these rules may be suspended, hidden, or permanently deleted by community moderators.</p>
      </div>

      <div class="policy-sec">
        <h3><span>🏆</span> 4. Voting Integrity & Fair Play</h3>
        <p>The "Who is your Best Creator?" poll is designed to fairly celebrate Tamil creators. Each visitor or registered account is permitted one vote. Automated voting scripts, bot networks, proxy manipulation, or vote buying are strictly prohibited and will result in vote disqualification.</p>
      </div>

      <div class="policy-sec">
        <h3><span>📜</span> 5. Certificates of Achievement</h3>
        <p>Official community certificates (Welcome, Achievement, Best Creator, Appreciation) carry verified digital authenticity. Redeeming tokens are single-use. Any attempt to forge tokens or tamper with certificate codes is forbidden.</p>
      </div>

      <div class="policy-sec">
        <h3><span>⚠️</span> 6. Mojang & Microsoft Disclaimer</h3>
        <p>NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT. TMC Awards is an independent, non-commercial fan community initiative. Minecraft is a trademark of Mojang Synergies AB.</p>
      </div>
    `;
  }

  if($('privacyBody')){
    $('privacyBody').innerHTML=isTa?`
      <div class="policy-sec">
        <h3><span>🛡️</span> 1. நாங்கள் சேகரிக்கும் தகவல்கள்</h3>
        <p>TMC Awards தளம் உங்கள் தனியுரிமையை மதிக்கிறது. நாங்கள் பின்வரும் தகவல்களை மட்டுமே சேகரிக்கிறோம்:</p>
        <ul>
          <li><strong>கணக்குத் தகவல்:</strong> உள்நுழைவு மற்றும் சரிபார்ப்பிற்கான உங்கள் மின்னஞ்சல் முகவரி மற்றும் கடவுச்சொல்.</li>
          <li><strong>சுயவிவரத் தகவல்:</strong> பயனர் பெயர் (handle), உங்கள் பெயர், YouTube/Twitch சேனல் பெயர், சேனல் இணைப்பு, உங்களைப் பற்றிய குறிப்பு (Bio), அவதார் படம் (பதிவேற்றம்/முகவரி/எமோஜி), மற்றும் சமூக ஊடக இணைப்புகள்.</li>
          <li><strong>தளப் பங்களிப்புத் தரவு:</strong> நீங்கள் அளித்த வாக்கு (Best Creator Vote) மற்றும் பெற்ற சமூக சான்றிதழ்கள்.</li>
        </ul>
      </div>

      <div class="policy-sec">
        <h3><span>⚙️</span> 2. தகவல்களைப் பயன்படுத்தும் விதம்</h3>
        <p>சேகரிக்கப்பட்ட தகவல்கள் பின்வரும் நோக்கங்களுக்காக மட்டுமே பயன்படுத்தப்படுகின்றன:</p>
        <ul>
          <li>பொதுக் காட்சியகத்தில் உங்கள் படைப்பாளர் சுயவிவர அட்டையை காட்சிப்படுத்த.</li>
          <li>வாக்கெடுப்பில் நியாயமான வாக்கு எண்ணிக்கையை உறுதிசெய்ய.</li>
          <li>உங்களுக்கான பிரத்யேக சமூக சான்றிதழ்களை உருவாக்கவும் சரிபார்க்கவும்.</li>
          <li>உங்கள் கணக்கில் பாதுகாப்பாக உள்நுழைய.</li>
        </ul>
      </div>

      <div class="policy-sec">
        <h3><span>🔒</span> 3. தரவுப் பாதுகாப்பு & LocalStorage</h3>
        <p>நாங்கள் உங்கள் தனிப்பட்ட தகவல்களை எந்தவொரு மூன்றாம் தரப்பினருக்கும் விற்பனை செய்வதோ அல்லது பகிர்வதோ இல்லை. உங்கள் மின்னஞ்சல் முகவரி பொதுக் காட்சியகத்தில் எவருக்கும் வெளிப்படுத்தப்படாது. உங்கள் தீம் (Dark/Light) மற்றும் மொழி விருப்பங்கள் உங்கள் உலாவியின் LocalStorage இல் மட்டுமே சேமிக்கப்படும்.</p>
      </div>

      <div class="policy-sec">
        <h3><span>🗑️</span> 4. உங்கள் உரிமைகள் & கணக்கு நீக்குதல்</h3>
        <p>உங்கள் தரவின் மீது உங்களுக்கு முழு உரிமை உண்டு. உங்கள் சுயவிவரக் குறிப்புகள், சமூக இணைப்புகள் மற்றும் படத்தை எப்போது வேண்டுமானாலும் உங்கள் சுயவிவரப் பக்கத்தில் திருத்தலாம். விரும்பினால், "கணக்கை நீக்கு" பொத்தானைப் பயன்படுத்தி உங்கள் கணக்கையும் சுயவிவரத்தையும் உடனே நிரந்தரமாக நீக்கலாம்.</p>
      </div>

      <div class="policy-sec">
        <h3><span>🔗</span> 5. மூன்றாம் தரப்பு இணைப்புகள்</h3>
        <p>எங்கள் தளம் YouTube, Discord, Instagram, Twitch, X போன்ற தளங்களின் வெளிப்புற இணைப்புகளைக் கொண்டுள்ளது. அந்த தளங்களின் தனியுரிமைக் கொள்கைகளுக்கு நாங்கள் பொறுப்பல்ல.</p>
      </div>
    `:`
      <div class="policy-sec">
        <h3><span>🛡️</span> 1. Information We Collect</h3>
        <p>TMC Awards values your privacy. We only collect the minimal information required to deliver our community features:</p>
        <ul>
          <li><strong>Account Data:</strong> Your email address and secure password credentials used for signing in.</li>
          <li><strong>Creator Profile Data:</strong> Handle, display name, YouTube/Twitch channel name and link, bio, custom avatar (uploaded image file or image URL), and social media links.</li>
          <li><strong>Community Interactions:</strong> Creator likes, Best Creator vote selection, and redeemed certificates.</li>
        </ul>
      </div>

      <div class="policy-sec">
        <h3><span>⚙️</span> 2. How We Use Your Information</h3>
        <p>Your information is used solely for the following purposes:</p>
        <ul>
          <li>To display and feature your creator showcase card on the community grid.</li>
          <li>To record and calculate fair community voting results for the Best Creator Award.</li>
          <li>To generate, issue, and verify official TMC digital achievement certificates.</li>
          <li>To authenticate and safeguard your profile management sessions.</li>
        </ul>
      </div>

      <div class="policy-sec">
        <h3><span>🔒</span> 3. Data Protection & Browser Storage</h3>
        <p>We do not sell, rent, or monetize your personal data. Your email address is strictly confidential and is never displayed publicly on the creator showcase. Theme preferences (Dark / Light mode) and language settings are stored securely on your own device via browser LocalStorage.</p>
      </div>

      <div class="policy-sec">
        <h3><span>🗑️</span> 4. Your Rights & Account Deletion</h3>
        <p>You have full ownership of your creator presence. You can modify your public profile information at any time from your dashboard. Furthermore, you can permanently delete your account and profile anytime using the "Delete account" feature.</p>
      </div>

      <div class="policy-sec">
        <h3><span>🔗</span> 5. Third-Party Links</h3>
        <p>Our website provides direct links to external creator channels on YouTube, Discord, Twitch, Instagram, and X. These external sites operate under their own independent privacy policies.</p>
      </div>
    `;
  }
}

function setupPolicyModals(){
  renderLegalContent();

  const openTerms=(e)=>{
    if(e) e.preventDefault();
    renderLegalContent();
    toggleMobileMenu(false);
    $('termsDlg').showModal();
  };

  const openPrivacy=(e)=>{
    if(e) e.preventDefault();
    renderLegalContent();
    toggleMobileMenu(false);
    $('privacyDlg').showModal();
  };

  if($('footTermsBtn')) $('footTermsBtn').onclick=openTerms;
  if($('footPrivacyBtn')) $('footPrivacyBtn').onclick=openPrivacy;
  if($('mTermsBtn')) $('mTermsBtn').onclick=openTerms;
  if($('mPrivacyBtn')) $('mPrivacyBtn').onclick=openPrivacy;
  if($('authLinkTerms')) $('authLinkTerms').onclick=openTerms;
  if($('authLinkPrivacy')) $('authLinkPrivacy').onclick=openPrivacy;

  if($('termsClose')) $('termsClose').onclick=()=>$('termsDlg').close();
  if($('termsAgreeBtn')) $('termsAgreeBtn').onclick=()=>{
    $('termsDlg').close();
    if($('aAgreeTerms')) $('aAgreeTerms').checked=true;
  };

  if($('privacyClose')) $('privacyClose').onclick=()=>$('privacyDlg').close();
  if($('privacyAgreeBtn')) $('privacyAgreeBtn').onclick=()=>{
    $('privacyDlg').close();
    if($('aAgreeTerms')&&!$('aAgreeTerms').checked) $('aAgreeTerms').checked=true;
  };
}

function checkAdminTokenUrl(){
  const hash=(location.hash||'').toLowerCase();
  if(hash.includes('admin')){
    setPage('404');
  }
}

function rerender(){
  themeButtons();fillSelects();authUi();authBtns();renderGrid();renderMyCerts();
  if(session){preview()}
  samples();
  renderLegalContent();
  if($('mLangVal')) $('mLangVal').textContent = lang()==='ta'?'தமிழ்':'English';
}
document.addEventListener('langchange',rerender);
themeButtons();fillSelects();swatches();setupAvatarControls();setupCustomLinksControls();setupWelcomeCertModal();setupAuthPasswordControls();setupDiscordAuthControls();setupPolicyModals();authUi();authBtns();
sb.auth.onAuthStateChange((ev,s)=>{setTimeout(()=>onSession(s),0)});

(async()=>{
  // 1. Immediately restore session before anything else so refresh keeps user logged in
  try{
    const {data}=await sb.auth.getSession();
    const curSess=(data&&data.session)?data.session:session;
    if(curSess){
      await onSession(curSess);
    }
  }catch(e){
    if(session) await onSession(session);
  }

  // 2. Load feeds in parallel
  await Promise.allSettled([
    loadServerIcon(),
    loadPublic(),
    loadMyVote()
  ]);

  samples();
  
  checkAdminTokenUrl();
  const initialHash=(location.hash||'').split('?')[0].replace('#','').toLowerCase();
  if(initialHash.includes('admin')){
    setPage('404');
  } else if(PAGES.includes(initialHash)){
    setPage(initialHash);
  } else {
    setPage('showcase');
  }
})();
})();
